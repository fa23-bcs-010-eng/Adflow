from google.adk.agents.llm_agent import Agent

# Mock tool implementation
def get_current_time(city: str) -> dict:
    """Returns the current time in a specified city."""
    return {"status": "success", "city": city, "time": "10:30 AM"}

root_agent = Agent(
    model='gemini-2.5-flash',
    name='root_agent',
    description="Adflow AI assistant for marketplace and ad-posting guidance.",
    instruction=(
        "You are Adflow AI Assistant. Help users with posting ads, account flow, "
        "dashboard navigation, packages, and general product guidance. "
        "Keep answers concise and practical. Use a friendly tone."
    ),
    tools=[get_current_time],
)
