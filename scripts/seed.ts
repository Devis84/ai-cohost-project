import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const TEST_EMAIL = "host@example.com"
const TEST_PASSWORD = "password123"

const MOCK_PROPERTY = {
  property_name: "Maltese Maisonette",
  slug: "maltese-maisonette",
  city: "Valletta",
  country: "Malta",
  address: "42 Old Bakery Street, Valletta, VLT 1450",
  wifi_name: "Maisonette_Guest",
  wifi_password: "vlt_2024",
  checkin_time: "15:00",
  checkout_time: "11:00",
  checkin_instructions:
    "Enter through the blue main door on Old Bakery Street. The lockbox is on the wall to the right. Take the stairs to the second floor — your apartment is the first door on the left.",
  lockbox_code: "8842",
  emergency_numbers: "Police: 112 | Ambulance: 196 | Host: +356 7700 1234",
  house_rules:
    "No smoking indoors. Quiet hours 22:00–08:00. No parties or events. Please remove shoes at the door. Recycling bins are in the courtyard.",
  description:
    "A beautifully restored Maltese maisonette in the heart of Valletta, just steps from St. John's Co-Cathedral and the Grand Harbour. Features original limestone walls, high ceilings, and a private rooftop terrace with stunning harbour views.",
  amenities:
    "Air conditioning in all rooms, fully equipped kitchen (oven, microwave, dishwasher, Nespresso machine), washing machine, 55\" smart TV with Netflix, high-speed WiFi (100 Mbps), iron and ironing board, hair dryer, fresh towels and linens.",
  parking_info:
    "Street parking is limited in Valletta. The nearest car park is MCP Valletta Waterfront (5 min walk, €8/day). We recommend using the public ferry or bus instead.",
  local_info:
    "Valletta is a UNESCO World Heritage Site and one of Europe's smallest capital cities. Everything is walkable. The Upper Barrakka Gardens (3 min) offer spectacular views. Republic Street has the best shops and cafés.",
  emergency_info:
    "Nearest hospital: Mater Dei Hospital (15 min by taxi). Nearest pharmacy: Brown's Pharmacy, 72 Republic Street (open until 19:00). For urgent maintenance issues, call the host at +356 7700 1234.",
  ai_enabled: true,
  whatsapp_enabled: false,
  telegram_enabled: false,
  welcomebook_enabled: true,
  knowledge_base: {
    welcome_book: {
      description:
        "A beautifully restored Maltese maisonette in the heart of Valletta, just steps from St. John's Co-Cathedral and the Grand Harbour.",
      amenities:
        "Air conditioning, fully equipped kitchen with Nespresso, washing machine, 55\" smart TV with Netflix, high-speed WiFi, fresh towels and linens.",
      house_rules:
        "No smoking indoors. Quiet hours 22:00–08:00. No parties. Remove shoes at the door. Recycling bins in the courtyard.",
      parking:
        "MCP Valletta Waterfront car park (5 min walk, €8/day). We recommend public transport — bus stop is 2 minutes away.",
      trash:
        "General waste: grey bin in the courtyard, collected Mon/Wed/Fri. Recycling: green bin, collected Tue/Thu. Glass: bring to the green igloos on Merchants Street.",
      ac:
        "Each room has an individual AC unit with remote. Please turn off when leaving the apartment to save energy. Remotes are on the bedside tables.",
      boiler:
        "Hot water is instant — no need to pre-heat. The boiler switch is in the bathroom if needed. If water isn't heating, check the red switch above the bathroom door.",
      restaurants:
        "Noni (fine dining, 5 min walk) | Legligin (Maltese wine bar, 3 min) | Palazzo Preca (courtyard dining, 4 min) | Caffe Cordina (historic café, 2 min) | Street food at Is-Suq tal-Belt market.",
      transport:
        "Bus: Lines 1, 2, 3 from City Gate to most destinations. Ferry: Valletta–Sliema ferry (€1.50, runs every 30 min). Taxi: Bolt and eCabs apps work well. Airport: 25 min by taxi (~€20).",
      local_guide:
        "Must-see: St. John's Co-Cathedral, Upper Barrakka Gardens (noon cannon salute daily), Fort St. Elmo & War Museum, Strait Street for nightlife. Day trips: Mdina (30 min by bus), Blue Grotto, Three Cities ferry.",
      emergency:
        "Police: 112 | Ambulance: 196 | Host: +356 7700 1234 | Nearest hospital: Mater Dei (15 min taxi) | Pharmacy: Brown's, 72 Republic St.",
      checkout_notes:
        "Please leave keys in the lockbox by 11:00. Strip the beds and leave used towels in the bathroom. Take out any rubbish. Turn off AC and lights. Thank you for staying!",
      extra_notes:
        "Beach towels are in the hallway closet — feel free to use them. The rooftop terrace is shared with one other apartment; please be respectful after 22:00.",
    },
    ai_training: {
      faq: "Q: What's the WiFi? A: Network: Maisonette_Guest, Password: vlt_2024\nQ: Where do I park? A: MCP Valletta Waterfront, 5 min walk, €8/day.\nQ: How do I get to the airport? A: Taxi ~€20, 25 min. Use Bolt or eCabs app.\nQ: Is there a supermarket nearby? A: Welbee's at City Gate (3 min walk).\nQ: Can I extend checkout? A: Please ask the host. Late checkout until 13:00 may be possible (€15 fee).",
      troubleshooting:
        "AC not working: Check if the remote has batteries. The AC unit has a manual on/off button on the side.\nNo hot water: Check the red boiler switch above the bathroom door.\nWiFi issues: Router is in the living room shelf. Unplug for 30 seconds and plug back in.\nLockbox jammed: Press the reset button (small hole below the keypad) with a pin.",
      guest_style:
        "Friendly and helpful. Use a warm, conversational tone. Address guests by name when possible. Offer specific recommendations rather than generic advice.",
      hidden_notes:
        "The neighbours in apartment 2B are sensitive to noise — always remind guests about quiet hours. The rooftop door sometimes sticks — push firmly and lift the handle slightly.",
      additional_notes:
        "Beach towels are in the hallway closet. Extra pillows and blankets are in the bedroom wardrobe top shelf. The Nespresso machine uses original capsules — a starter pack is provided.",
    },
  },
}

async function seed() {
  console.log("Seeding test data...\n")

  console.log(`Creating test user: ${TEST_EMAIL}`)

  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users?.find((u) => u.email === TEST_EMAIL)

  let userId: string

  if (existing) {
    console.log(`  User already exists (${existing.id}), updating password...`)
    await supabase.auth.admin.updateUserById(existing.id, { password: TEST_PASSWORD })
    userId = existing.id
  } else {
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    })

    if (userError) {
      console.error("  Failed to create user:", userError.message)
      process.exit(1)
    }

    userId = newUser.user.id
    console.log(`  Created user: ${userId}`)
  }

  console.log(`\nUpserting property: ${MOCK_PROPERTY.property_name}`)

  const { data: existingProp } = await supabase
    .from("properties")
    .select("id")
    .eq("slug", MOCK_PROPERTY.slug)
    .maybeSingle()

  const withOwner = { ...MOCK_PROPERTY, owner_id: userId }

  if (existingProp) {
    // Try with owner_id first, fall back without if column doesn't exist yet
    let result = await supabase
      .from("properties")
      .update(withOwner)
      .eq("id", existingProp.id)

    if (result.error?.message?.includes("owner_id")) {
      console.log("  owner_id column not found, updating without it...")
      result = await supabase
        .from("properties")
        .update(MOCK_PROPERTY)
        .eq("id", existingProp.id)
    }

    if (result.error) {
      console.error("  Failed to update property:", result.error.message)
      process.exit(1)
    }

    console.log(`  Updated existing property (${existingProp.id})`)
  } else {
    let result = await supabase
      .from("properties")
      .insert(withOwner)
      .select("id")
      .single()

    if (result.error?.message?.includes("owner_id")) {
      console.log("  owner_id column not found, inserting without it...")
      result = await supabase
        .from("properties")
        .insert(MOCK_PROPERTY)
        .select("id")
        .single()
    }

    if (result.error) {
      console.error("  Failed to insert property:", result.error.message)
      process.exit(1)
    }

    console.log(`  Created property: ${result.data.id}`)
  }

  console.log("\n--- Seed complete ---")
  console.log(`\nHost login:   http://localhost:3000/login`)
  console.log(`  Email:      ${TEST_EMAIL}`)
  console.log(`  Password:   ${TEST_PASSWORD}`)
  console.log(`\nGuest page:   http://localhost:3000/guest/${MOCK_PROPERTY.slug}`)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
