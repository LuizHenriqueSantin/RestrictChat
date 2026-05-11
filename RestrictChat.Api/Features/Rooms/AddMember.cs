using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using RestrictChat.Api.Infrastructure.Postgres;
using RestrictChat.Api.Infrastructure.Postgres.Entities;

namespace RestrictChat.Api.Features.Rooms;

public record AddMemberRequest(string Username);

public class AddMemberValidator : AbstractValidator<AddMemberRequest>
{
    public AddMemberValidator()
    {
        RuleFor(x => x.Username).NotEmpty();
    }
}

public class AddMemberHandler(AppDbContext db)
{
    public async Task Handle(Guid roomId, Guid requesterId, AddMemberRequest req, CancellationToken ct)
    {
        var room = await db.Groups
            .Include(g => g.UserGroups)
            .FirstOrDefaultAsync(g => g.Id == roomId, ct)
            ?? throw new KeyNotFoundException("Sala não encontrada.");

        if (room.OwnerId != requesterId)
            throw new UnauthorizedAccessException("Apenas o dono da sala pode adicionar membros.");

        var userToAdd = await db.Users.FirstOrDefaultAsync(u => u.Username == req.Username, ct)
            ?? throw new KeyNotFoundException($"Usuário '{req.Username}' não encontrado.");

        var alreadyMember = room.UserGroups.Any(ug => ug.UserId == userToAdd.Id);
        if (alreadyMember)
            throw new InvalidOperationException("Usuário já é membro desta sala.");

        db.UserGroups.Add(new UserGroup { UserId = userToAdd.Id, GroupId = roomId });
        await db.SaveChangesAsync(ct);
    }
}

public static class AddMemberEndpoint
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/rooms/{roomId:guid}/members", async (
            Guid roomId,
            AddMemberRequest req,
            AddMemberValidator validator,
            AddMemberHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(req, ct);
            if (!validation.IsValid)
                return Results.ValidationProblem(validation.ToDictionary());

            var requesterId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

            try
            {
                await handler.Handle(roomId, requesterId, req, ct);
                return Results.NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { message = ex.Message });
            }
        })
        .WithName("AddMember")
        .WithTags("Rooms")
        .RequireAuthorization();
    }
}
