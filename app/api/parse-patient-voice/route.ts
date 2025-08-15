import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        name: z.string().optional(),
        age: z.number().optional(),
        address: z.string().optional(),
        contact: z.string().optional(),
      }),
      prompt: `Extract the patient's name, age, contact number, and address from the following text. If a piece of information is not explicitly mentioned, omit it. Prioritize extracting a contact number if present.
      
      Examples:
      - "Add patient John Doe, he is 30 years old and lives at 123 Main Street. His number is 555-1234." -> { "name": "John Doe", "age": 30, "address": "123 Main Street", "contact": "555-1234" }
      - "Add a new patient named Jane Smith, she is 45." -> { "name": "Jane Smith", "age": 45 }
      - "Patient Michael Brown, contact 987-654-3210." -> { "name": "Michael Brown", "contact": "987-654-3210" }
      - "Add a patient living in London." -> { "address": "London" }
      
      Text: "${text}"`,
    })

    return new Response(JSON.stringify(object), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error parsing voice command:", error)
    return new Response(JSON.stringify({ error: "Failed to parse voice command" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
