using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using RestrictChat.Api.Infrastructure.Mongo;

namespace RestrictChat.Api.Features.Moderation;

public class ModerationService(
    IHttpClientFactory httpClientFactory,
    IConfiguration config,
    MessageRepository messageRepository,
    ILogger<ModerationService> logger)
{
    public async Task<bool> IsApprovedAsync(Guid roomId, string topic, string content, CancellationToken ct)
    {
        var context = await messageRepository.GetContextAsync(roomId, 10, ct);

        var history = context.Count > 0
            ? string.Join("\n", context.Select(m => $"{m.Username}: {m.Content}"))
            : "(sem mensagens anteriores)";

        var systemPrompt = $"""
            You are a chat room moderator. The room topic is "{topic}".
            Your ONLY job: decide if the new message belongs in this conversation.
            
            APPROVE (reply "1") if the message:
            - Is clearly about "{topic}" or directly related to it.
            - Is a reaction, opinion or emotion about the conversation (e.g. "congrats", "I disagree", "nice", "wow", "exactly", "lol", "haha").
            - Is a short social response that fits naturally in the flow of the chat (e.g. "yeah", "no way", "really?", "agreed").
            - Makes sense given the recent context of the conversation.
            
            BLOCK (reply "0") if the message:
            - Is clearly about a completely different topic unrelated to "{topic}".
            - Changes the subject to something with no connection to "{topic}" or the current conversation.
            
            You must reply with ONLY the digit 0 or 1. No other text, no explanation.
            """;

        var userPrompt = $"""
            Recent approved messages (context only):
            {history}

            New message to evaluate: "{content}"

            Is this message related to the topic "{topic}"? Reply ONLY with 0 or 1.
            """;

        var body = new
        {
            model = "llama-3.1-8b-instant",
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            },
            max_tokens = 1,
            temperature = 0
        };

        var client = httpClientFactory.CreateClient("Groq");
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
        {
            Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", config["Groq:ApiKey"]);

        var response = await client.SendAsync(request, ct);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(ct);
            logger.LogError("Groq API retornou erro {StatusCode}: {Body}", (int)response.StatusCode, errorBody);
            throw new HttpRequestException($"Groq API error {(int)response.StatusCode}: {errorBody}");
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        logger.LogDebug("Groq response: {Json}", json);

        using var doc = JsonDocument.Parse(json);

        var result = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString()?.Trim();

        logger.LogInformation("Moderação: topic={Topic}, result={Result}", topic, result);

        return result == "1";
    }
}
