using System.Security.Claims;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using RestrictChat.Api.Infrastructure.Postgres;
using RestrictChat.Api.Infrastructure.Postgres.Entities;

namespace RestrictChat.Api.Features.Rooms;

public record CreateRoomRequest(string Name, string Topic);
public record CreateRoomResponse(Guid Id, string Name, string Topic, DateTime CreatedAt);

public class CreateRoomValidator : AbstractValidator<CreateRoomRequest>
{
    public CreateRoomValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MinimumLength(3).MaximumLength(100);
        RuleFor(x => x.Topic).NotEmpty().MinimumLength(3).MaximumLength(100);
    }
}

public class CreateRoomHandler(AppDbContext db)
{
    public async Task<CreateRoomResponse> Handle(CreateRoomRequest req, Guid ownerId, CancellationToken ct)
    {
        var nameExists = await db.Groups.AnyAsync(g => g.Name == req.Name, ct);
        if (nameExists)
            throw new InvalidOperationException("Já existe uma sala com esse nome.");

        var group = new Group
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Topic = req.Topic,
            OwnerId = ownerId
        };

        group.UserGroups = [new UserGroup { UserId = ownerId, GroupId = group.Id }];

        db.Groups.Add(group);
        await db.SaveChangesAsync(ct);

        return new CreateRoomResponse(group.Id, group.Name, group.Topic, group.CreatedAt);
    }
}

public static class CreateRoomEndpoint
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/rooms", async (
            CreateRoomRequest req,
            CreateRoomValidator validator,
            CreateRoomHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(req, ct);
            if (!validation.IsValid)
                return Results.ValidationProblem(validation.ToDictionary());

            var ownerId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

            try
            {
                var response = await handler.Handle(req, ownerId, ct);
                return Results.Created($"/rooms/{response.Id}", response);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { message = ex.Message });
            }
        })
        .WithName("CreateRoom")
        .WithTags("Rooms")
        .RequireAuthorization();
    }
}
