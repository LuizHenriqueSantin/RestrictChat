using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using RestrictChat.Api.Infrastructure.Mongo;
using RestrictChat.Api.Infrastructure.Postgres;

namespace RestrictChat.Api.Features.Rooms;

public class DeleteRoomHandler(AppDbContext db, MessageRepository messageRepository)
{
    public async Task Handle(Guid roomId, Guid userId, CancellationToken ct)
    {
        var room = await db.Groups.FindAsync([roomId], ct);

        if (room is null)
            throw new KeyNotFoundException("Sala não encontrada.");

        if (room.OwnerId != userId)
            throw new UnauthorizedAccessException("Apenas o dono pode excluir a sala.");

        await messageRepository.DeleteByRoomAsync(roomId, ct);

        db.Groups.Remove(room);
        await db.SaveChangesAsync(ct);
    }
}

public static class DeleteRoomEndpoint
{
    public static void Map(WebApplication app)
    {
        app.MapDelete("/rooms/{roomId:guid}", async (
            Guid roomId,
            ClaimsPrincipal user,
            DeleteRoomHandler handler,
            CancellationToken ct) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

            try
            {
                await handler.Handle(roomId, userId, ct);
                return Results.NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Results.Forbid();
            }
        })
        .WithName("DeleteRoom")
        .WithTags("Rooms")
        .RequireAuthorization();
    }
}
