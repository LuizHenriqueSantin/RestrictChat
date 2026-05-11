using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using RestrictChat.Api.Infrastructure.Postgres;

namespace RestrictChat.Api.Features.Rooms;

public record GetMembersResponse(Guid Id, string Username, string Email, bool IsOwner);

public class GetMembersHandler(AppDbContext db)
{
    public async Task<List<GetMembersResponse>> Handle(Guid roomId, Guid requesterId, CancellationToken ct)
    {
        var room = await db.Groups
            .Include(g => g.UserGroups)
            .ThenInclude(ug => ug.User)
            .FirstOrDefaultAsync(g => g.Id == roomId, ct)
            ?? throw new KeyNotFoundException("Sala não encontrada.");

        var isMember = room.UserGroups.Any(ug => ug.UserId == requesterId);
        if (!isMember)
            throw new UnauthorizedAccessException("Você não é membro desta sala.");

        return room.UserGroups
            .Select(ug => new GetMembersResponse(
                ug.User.Id,
                ug.User.Username,
                ug.User.Email,
                ug.User.Id == room.OwnerId))
            .OrderByDescending(m => m.IsOwner)
            .ThenBy(m => m.Username)
            .ToList();
    }
}

public static class GetMembersEndpoint
{
    public static void Map(WebApplication app)
    {
        app.MapGet("/rooms/{roomId:guid}/members", async (
            Guid roomId,
            GetMembersHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var requesterId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

            try
            {
                var members = await handler.Handle(roomId, requesterId, ct);
                return Results.Ok(members);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Forbid();
            }
        })
        .WithName("GetMembers")
        .WithTags("Rooms")
        .RequireAuthorization();
    }
}
