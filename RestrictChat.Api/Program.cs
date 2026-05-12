using Microsoft.EntityFrameworkCore;
using RestrictChat.Api.Common.Extensions;
using RestrictChat.Api.Features.Auth;
using RestrictChat.Api.Features.Messages;
using RestrictChat.Api.Features.Moderation;
using RestrictChat.Api.Features.Rooms;
using RestrictChat.Api.Features.Users;
using RestrictChat.Api.Hubs;
using RestrictChat.Api.Infrastructure.Mongo;
using RestrictChat.Api.Infrastructure.Postgres;

namespace RestrictChat.Api;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy =>
            {
                var frontendUrl = builder.Configuration["Frontend:Url"]!;
                policy
                    .WithOrigins(frontendUrl)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

        builder.Services.AddJwtAuth(builder.Configuration);
        builder.Services.AddAuthorization();
        builder.Services.AddSignalR();
        builder.Services.AddOpenApi();

        builder.Services.AddScoped<RegisterHandler>();
        builder.Services.AddScoped<RegisterValidator>();
        builder.Services.AddScoped<LoginHandler>();
        builder.Services.AddScoped<LoginValidator>();

        builder.Services.AddScoped<DeleteRoomHandler>();
        builder.Services.AddScoped<CreateRoomHandler>();
        builder.Services.AddScoped<CreateRoomValidator>();
        builder.Services.AddScoped<GetRoomsHandler>();
        builder.Services.AddScoped<GetMembersHandler>();
        builder.Services.AddScoped<AddMemberHandler>();
        builder.Services.AddScoped<AddMemberValidator>();

        builder.Services.AddScoped<SearchUserHandler>();

        builder.Services.AddScoped<GetHistoryHandler>();

        builder.Services.AddSingleton<MessageRepository>();
        builder.Services.AddScoped<ModerationService>();
        builder.Services.AddHttpClient("Groq");

        var app = builder.Build();

        if (app.Environment.IsDevelopment())
            app.MapOpenApi();

        app.UseCors("Frontend");
        if (app.Environment.IsDevelopment())
            app.UseHttpsRedirection();
        app.UseAuthentication();
        app.UseAuthorization();

        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.Migrate();
        }

        RegisterEndpoint.Map(app);
        LoginEndpoint.Map(app);

        DeleteRoomEndpoint.Map(app);
        CreateRoomEndpoint.Map(app);
        GetRoomsEndpoint.Map(app);
        GetMembersEndpoint.Map(app);
        AddMemberEndpoint.Map(app);

        SearchUserEndpoint.Map(app);

        GetHistoryEndpoint.Map(app);

        app.MapHub<ChatHub>("/hubs/chat");

        app.Run();
    }
}
