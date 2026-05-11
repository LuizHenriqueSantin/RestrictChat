using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using RestrictChat.Api.Features.Moderation;
using RestrictChat.Api.Infrastructure.Mongo;
using RestrictChat.Api.Infrastructure.Postgres;

namespace RestrictChat.Api.Hubs;

[Authorize]
public class ChatHub(
    AppDbContext db,
    MessageRepository messageRepository,
    ModerationService moderationService,
    ILogger<ChatHub> logger) : Hub
{
    public async Task JoinRoom(Guid roomId)
    {
        var userId = Guid.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var isMember = await db.UserGroups
            .AnyAsync(ug => ug.UserId == userId && ug.GroupId == roomId);

        if (!isMember)
        {
            await Clients.Caller.SendAsync("Error", "Você não é membro desta sala.");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, roomId.ToString());

        var history = await messageRepository.GetHistoryAsync(roomId, 50, null, CancellationToken.None);
        await Clients.Caller.SendAsync("RoomHistory", history);
    }

    public async Task SubscribeToRoom(Guid roomId)
    {
        var userId = Guid.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isMember = await db.UserGroups
            .AnyAsync(ug => ug.UserId == userId && ug.GroupId == roomId);

        if (isMember)
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId.ToString());
    }

    public async Task LeaveRoom(Guid roomId) =>
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId.ToString());

    public async Task SendMessage(Guid roomId, string content)
    {
        if (string.IsNullOrWhiteSpace(content) || content.Length > 1000)
        {
            await Clients.Caller.SendAsync("Error", "Mensagem inválida.");
            return;
        }

        var userId = Guid.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var username = Context.User!.FindFirstValue(ClaimTypes.Name)!;

        var isMember = await db.UserGroups
            .AnyAsync(ug => ug.UserId == userId && ug.GroupId == roomId);

        if (!isMember)
        {
            await Clients.Caller.SendAsync("Error", "Você não é membro desta sala.");
            return;
        }

        var room = await db.Groups.FindAsync(roomId);
        if (room is null)
        {
            await Clients.Caller.SendAsync("Error", "Sala não encontrada.");
            return;
        }

        await Clients.Caller.SendAsync("MessagePending");

        try
        {
            var approved = await moderationService.IsApprovedAsync(roomId, room.Topic, content, CancellationToken.None);

            if (!approved)
            {
                await Clients.Caller.SendAsync("MessageRejected", "Sua mensagem foi bloqueada por fugir do tema da sala.");
                return;
            }

            var message = new Message
            {
                RoomId = roomId,
                UserId = userId,
                Username = username,
                Content = content,
                SentAt = DateTime.UtcNow
            };

            logger.LogInformation("Inserindo mensagem no MongoDB para sala {RoomId}", roomId);
            await messageRepository.InsertAsync(message, CancellationToken.None);
            logger.LogInformation("Mensagem inserida com Id={Id}, broadcasting para grupo {RoomId}", message.Id, roomId);

            await Clients.Group(roomId.ToString()).SendAsync("ReceiveMessage", new
            {
                message.Id,
                RoomId = roomId,
                message.Username,
                message.Content,
                message.SentAt
            });

            logger.LogInformation("ReceiveMessage enviado para grupo {RoomId}", roomId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Erro ao processar mensagem na sala {RoomId}", roomId);
            await Clients.Caller.SendAsync("MessageRejected", "Erro interno ao processar sua mensagem.");
        }
    }
}
