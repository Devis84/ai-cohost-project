import { NextResponse } from "next/server"
import OpenAI from "openai"
import { supabase } from "@/lib/supabase"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {

  const { property_id, location } = await req.json()

  if (!property_id || !location) {
    return NextResponse.json({ error: "Missing data" })
  }

  const prompt = `
Generate a local guide for a vacation rental located here:

${location}

Return:

10 restaurants
5 cafes
5 attractions

Return ONLY valid JSON in this format:

{
 "restaurants":[
   {"title":"", "description":""}
 ],
 "cafes":[
   {"title":"", "description":""}
 ],
 "attractions":[
   {"title":"", "description":""}
 ]
}
`

const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",

  temperature: 0.7,

  max_tokens: 1200,

  messages: [
    {
      role: "user",
      content: prompt
    }
  ]
})

  const text = completion.choices[0].message.content || "{}"

  let data:any = {}

  try {
    data = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON" })
  }

  const rows:any[] = []

  data.restaurants?.forEach((r:any)=>{
    rows.push({
      property_id,
      type:"restaurant",
      title:r.title,
      description:r.description
    })
  })

  data.cafes?.forEach((c:any)=>{
    rows.push({
      property_id,
      type:"cafe",
      title:c.title,
      description:c.description
    })
  })

  data.attractions?.forEach((a:any)=>{
    rows.push({
      property_id,
      type:"attraction",
      title:a.title,
      description:a.description
    })
  })

  if(rows.length){

    await supabase
      .from("local_tips")
      .insert(rows)

  }

  return NextResponse.json({
    success:true,
    inserted:rows.length
  })

}