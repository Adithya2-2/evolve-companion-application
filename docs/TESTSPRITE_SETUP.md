# TestSprite MCP Integration 🐞

Integrate the **TestSprite Model Context Protocol (MCP)** server to enable autonomous AI testing for Evolve.

## 1. Get API Key
Visit [testsprite.com](https://testsprite.com), sign up, and create an API Key under Settings.

## 2. Configure Your IDE (Cursor, VS Code)

You must add the TestSprite MCP server to your AI assistant's configuration.

### Manual Setup
1. Open your IDE Settings / Features / MCP.
2. Click **Add New Server**.
3. Fill in the details:
   - **Name**: `TestSprite`
   - **Type**: `stdio`
   - **Command**: `npx -y @testsprite/testsprite-mcp@latest`
   - **Environment Variables**:
     ```
     TESTSPRITE_API_KEY=your_key_here
     ```

## 3. Usage
Once configured, you can ask your AI:
> "Use TestSprite to generate unit tests for `utils/emotionAnalyzer.ts`."

The MCP server will analyze the code, execute tests in a secure sandbox, and report results back to the chat.

**Security**: Never commit your API key to GitHub. Use environment variables in your IDE settings.
