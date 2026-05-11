using FluentValidation;
using Microsoft.EntityFrameworkCore;
using RestrictChat.Api.Infrastructure.Postgres;
using RestrictChat.Api.Infrastructure.Postgres.Entities;

namespace RestrictChat.Api.Features.Auth;

public record RegisterRequest(string Username, string Email, string Password);
public record RegisterResponse(Guid Id, string Username, string Email);

public class RegisterValidator : AbstractValidator<RegisterRequest>
{
    public RegisterValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(50);

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Z]").WithMessage("A senha deve conter pelo menos uma letra maiúscula.")
            .Matches("[0-9]").WithMessage("A senha deve conter pelo menos um número.")
            .Matches("[^a-zA-Z0-9]").WithMessage("A senha deve conter pelo menos um caractere especial.");
    }
}

public class RegisterHandler(AppDbContext db)
{
    public async Task<RegisterResponse> Handle(RegisterRequest req, CancellationToken ct)
    {
        var emailExists = await db.Users.AnyAsync(u => u.Email == req.Email.ToLower(), ct);
        if (emailExists)
            throw new InvalidOperationException("E-mail já está em uso.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = req.Username,
            Email = req.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 12)
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        return new RegisterResponse(user.Id, user.Username, user.Email);
    }
}

public static class RegisterEndpoint
{
    public static void Map(WebApplication app)
    {
        app.MapPost("/auth/register", async (
            RegisterRequest req,
            RegisterValidator validator,
            RegisterHandler handler,
            CancellationToken ct) =>
        {
            var validation = await validator.ValidateAsync(req, ct);
            if (!validation.IsValid)
                return Results.ValidationProblem(validation.ToDictionary());

            try
            {
                var response = await handler.Handle(req, ct);
                return Results.Created($"/users/{response.Id}", response);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { message = ex.Message });
            }
        })
        .WithName("Register")
        .WithTags("Auth")
        .AllowAnonymous();
    }
}
