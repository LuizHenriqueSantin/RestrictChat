using MongoDB.Driver;
using RestrictChat.Api.Infrastructure.Mongo;

namespace RestrictChat.Api.Infrastructure.Mongo;

public class MessageRepository
{
    private readonly IMongoCollection<Message> _collection;

    public MessageRepository(IConfiguration config)
    {
        var client = new MongoClient(config.GetConnectionString("MongoDB"));
        var database = client.GetDatabase(config["MongoDB:DatabaseName"]);
        _collection = database.GetCollection<Message>("messages");

        var indexKey = Builders<Message>.IndexKeys
            .Ascending(m => m.RoomId)
            .Descending(m => m.SentAt);

        _collection.Indexes.CreateOne(new CreateIndexModel<Message>(indexKey));
    }

    public async Task DeleteByRoomAsync(Guid roomId, CancellationToken ct) =>
        await _collection.DeleteManyAsync(m => m.RoomId == roomId, ct);

    public async Task InsertAsync(Message message, CancellationToken ct) =>
        await _collection.InsertOneAsync(message, cancellationToken: ct);

    public async Task<List<Message>> GetHistoryAsync(Guid roomId, int limit, DateTime? before, CancellationToken ct)
    {
        var filter = before.HasValue
            ? Builders<Message>.Filter.And(
                Builders<Message>.Filter.Eq(m => m.RoomId, roomId),
                Builders<Message>.Filter.Lt(m => m.SentAt, before.Value))
            : Builders<Message>.Filter.Eq(m => m.RoomId, roomId);

        var messages = await _collection
            .Find(filter)
            .SortByDescending(m => m.SentAt)
            .Limit(limit)
            .ToListAsync(ct);

        messages.Reverse();
        return messages;
    }

    public async Task<List<Message>> GetContextAsync(Guid roomId, int limit, CancellationToken ct)
    {
        var messages = await _collection
            .Find(m => m.RoomId == roomId)
            .SortByDescending(m => m.SentAt)
            .Limit(limit)
            .ToListAsync(ct);

        messages.Reverse();
        return messages;
    }
}
