using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using RestrictChat.Api.Infrastructure.Postgres;

namespace RestrictChat.Api.Features.Rooms;

public record GetRoomsResponse(Guid Id, string Name, string Topic, Guid OwnerId, string OwnerUsername, int MemberCount);

public class GetRoomsHandler(AppDbContext db)
{
    public async Task<List<GetRoomsResponse>> Handle(Guid userId, CancellationToken ct)
    {
        return await db.Groups
            .Where(g => g.UserGroups.Any(ug => ug.UserId == userId))
            .Select(g => new GetRoomsResponse(
                g.Id,
                g.Name,
                g.Topic,
                g.OwnerId,
                g.Owner.Username,
                g.UserGroups.Count))
            .ToListAsync(ct);
    }
}

public static class GetRoomsEndpoint
{
    public static void Map(WebApplication app)
    {
        app.MapGet("/rooms", async (
            GetRoomsHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var response = await handler.Handle(userId, ct);
            return Results.Ok(response);
        })
        .WithName("GetRooms")
        .WithTags("Rooms")
        .RequireAuthorization();
    }
}
