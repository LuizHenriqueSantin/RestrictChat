using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace RestrictChat.Api.Infrastructure.Mongo;

public class Message
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonGuidRepresentation(MongoDB.Bson.GuidRepresentation.Standard)]
    public Guid RoomId { get; set; }

    [BsonGuidRepresentation(MongoDB.Bson.GuidRepresentation.Standard)]
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
