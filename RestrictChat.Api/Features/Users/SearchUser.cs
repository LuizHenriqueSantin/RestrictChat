using Microsoft.EntityFrameworkCore;
using RestrictChat.Api.Infrastructure.Postgres;

namespace RestrictChat.Api.Features.Users;

public record SearchUserResponse(Guid Id, string Username, string Email);

public class SearchUserHandler(AppDbContext db)
{
    public async Task<SearchUserResponse?> Handle(string email, CancellationToken ct)
    {
        return await db.Users
            .Where(u => u.Email == email.ToLower())
            .Select(u => new SearchUserResponse(u.Id, u.Username, u.Email))
            .FirstOrDefaultAsync(ct);
    }
}

public static class SearchUserEndpoint
{
    public static void Map(WebApplication app)
    {
        app.MapGet("/users/search", async (
            string email,
            SearchUserHandler handler,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(email))
                return Results.BadRequest(new { message = "E-mail é obrigatório." });

            var user = await handler.Handle(email, ct);
            return user is null
                ? Results.NotFound(new { message = "Usuário não encontrado." })
                : Results.Ok(user);
        })
        .WithName("SearchUser")
        .WithTags("Users")
        .RequireAuthorization();
    }
}
