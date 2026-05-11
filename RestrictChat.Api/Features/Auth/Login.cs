using FluentValidation;
using Microsoft.EntityFrameworkCore;
using RestrictChat.Api.Common.Extensions;
using RestrictChat.Api.Infrastructure.Postgres;

namespace RestrictChat.Api.Features.Auth;

public record LoginRequest(string Email, string Password);
public record LoginResponse(Guid Id, string Username, string Email, string Token);

public class LoginValidator : AbstractValidator<LoginRequest>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class LoginHandler(AppDbContext db, TokenService tokenService)
{
    public async Task<LoginResponse> Handle(LoginRequest req, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.ToLower(), ct);

        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("E-mail ou senha inválidos.");

        var token = tokenService.Generate(user);

        return new LoginResponse(user.Id, user.Username, user.Email, token);
    }
}

public static class LoginEndpoint
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/auth/login", async (
            LoginRequest req,
            LoginValidator validator,
            LoginHandler handler,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(req, ct);
            if (!validation.IsValid)
                return Results.ValidationProblem(validation.ToDictionary());

            try
            {
                var response = await handler.Handle(req, ct);
                return Results.Ok(response);
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        })
        .WithName("Login")
        .WithTags("Auth")
        .AllowAnonymous();
    }
}
