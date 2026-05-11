using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using RestrictChat.Api.Infrastructure.Mongo;
using RestrictChat.Api.Infrastructure.Postgres;

namespace RestrictChat.Api.Features.Messages;

public record GetHistoryResponse(string Id, string Username, string Content, DateTime SentAt);

public class GetHistoryHandler(AppDbContext db, MessageRepository messageRepository)
{
    public async Task<List<GetHistoryResponse>> Handle(
        Guid roomId, Guid userId, DateTime? before, CancellationToken ct)
    {
        var isMember = await db.UserGroups
            .AnyAsync(ug => ug.UserId == userId && ug.GroupId == roomId, ct);

        if (!isMember)
            throw new UnauthorizedAccessException("Você não é membro desta sala.");

        var messages = await messageRepository.GetHistoryAsync(roomId, 50, before, ct);

        return messages.Select(m => new GetHistoryResponse(
            m.Id, m.Username, m.Content, m.SentAt)).ToList();
    }
}

public static class GetHistoryEndpoint
{
    public static void Map(WebApplication app)
    {
        app.MapGet("/rooms/{roomId:guid}/messages", async (
            Guid roomId,
            DateTime? before,
            GetHistoryHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

            try
            {
                var response = await handler.Handle(roomId, userId, before, ct);
                return Results.Ok(response);
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Forbid();
            }
        })
        .WithName("GetHistory")
        .WithTags("Messages")
        .RequireAuthorization();
    }
}
