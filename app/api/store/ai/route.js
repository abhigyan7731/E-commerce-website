import { getAuth } from "@clerk/nextjs/server"
import authSeller from "@/middleware/authSeller"
import { NextResponse } from "next/server"
import { openai } from "@/configs/openai";

async function main(base64Image, mimType){
    // Validate OpenAI configuration
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
    }
    
    if (!process.env.OPENAI_MODEL) {
        throw new Error('OpenAI model not configured');
    }
    
    const messages = [
        {
            "role": "system",
            "content": `You are a product listing assistant for an e-commerce store. Your job is to analyze an image of a product and generate structured data.
            Respond ONLY with raw JSON (no code block, no markdown, no explanation).
            The JSON must strictly follow this schema:
            {
                "name": "string",
                "description": "string"
            }`
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Analyze this image and return name + description",
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": `data:${mimType};base64,${base64Image}`
                    },
                },
            ],
        }
    ];

    const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages,
        max_tokens: 150,
        temperature: 0.1,
    });

    if (!response?.choices?.[0]?.message?.content) {
        throw new Error('AI service returned empty response');
    }
    
    const raw = response.choices[0].message.content;
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
        parsed = JSON.parse(cleaned);
        
        // Validate the required fields
        if (!parsed.name || !parsed.description) {
            throw new Error('AI response missing required fields');
        }
        
        // Ensure fields are strings
        if (typeof parsed.name !== 'string' || typeof parsed.description !== 'string') {
            throw new Error('AI response fields must be strings');
        }
        
    } catch (error) {
        console.error('JSON parsing error:', error.message);
        console.error('Raw AI response:', raw);
        throw new Error("AI did not return valid JSON");
    }
    
    return parsed;
    
  
}
export async function POST(request) { 
    try {
        // Authentication check
        const {userId} = getAuth(request)
        console.log('AI route - userId:', userId)
        
        if (!userId) {
            console.log('AI route - No userId found')
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }
        
        const authResult = await authSeller(userId)
        console.log('AI route - authSeller result:', authResult)
        
        if (!authResult) {
            console.log('AI route - authSeller returned false')
            return NextResponse.json({ error: 'Seller authorization required' }, { status: 401 })
        }
        
        // Request validation
        let requestData;
        try {
            requestData = await request.json();
        } catch (jsonError) {
            return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }
        
        const { base64Image, mimType } = requestData;
        
        // Input validation
        if (!base64Image) {
            return NextResponse.json({ error: 'base64Image is required' }, { status: 400 });
        }
        
        if (!mimType) {
            return NextResponse.json({ error: 'mimType is required' }, { status: 400 });
        }
        
        // Validate mimType format
        if (!mimType.startsWith('image/')) {
            return NextResponse.json({ error: 'Invalid mimType: must be an image type' }, { status: 400 });
        }
        
        // Validate base64Image format
        if (typeof base64Image !== 'string' || base64Image.length === 0) {
            return NextResponse.json({ error: 'Invalid base64Image: must be a non-empty string' }, { status: 400 });
        }
        
        const result = await main(base64Image, mimType);
        return NextResponse.json({...result });
        
    } catch (error) {
        console.error('Error processing AI request:', error);
        
        // Return more specific error messages
        if (error.message === 'AI did not return valid JSON') {
            return NextResponse.json({ error: 'AI service returned invalid response' }, { status: 500 });
        }
        
        if (error.code === 'insufficient_quota' || error.code === 'rate_limit_exceeded') {
            return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 503 });
        }
        
        return NextResponse.json({ 
            error: error.message || 'Internal server error' 
        }, { status: 500 });
    }
}