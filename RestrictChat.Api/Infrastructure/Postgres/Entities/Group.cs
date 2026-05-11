namespace RestrictChat.Api.Infrastructure.Postgres.Entities;

public class Group
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid OwnerId { get; set; }
    public User Owner { get; set; } = null!;

    public ICollection<UserGroup> UserGroups { get; set; } = [];
}
