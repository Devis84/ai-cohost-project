type StringMap = Record<string, unknown>
type NullableText = string | null | undefined

export type LegacyPromptProperty = {
  id?: NullableText
  property_name?: NullableText
  slug?: NullableText
  city?: NullableText
  country?: NullableText
  address?: NullableText
  checkin_time?: NullableText
  checkout_time?: NullableText
  checkin_instructions?: NullableText
  lockbox_code?: NullableText
  wifi_name?: NullableText
  wifi_password?: NullableText
  emergency_numbers?: NullableText
  contacts?: string[]
  house_rules?: NullableText
  description?: NullableText
  amenities?: NullableText
  parking_info?: NullableText
  local_info?: NullableText
  emergency_info?: NullableText
  ai_knowledge?: NullableText
  knowledge_base?: {
    guest_page?: StringMap
    guest_support?: StringMap
    welcome_book?: StringMap
    local_guide?: StringMap
    extra_services?: StringMap
    ai_training?: StringMap
    italian_compliance?: StringMap
  } | null
}

export type KnowledgeDocument = {
  id: string
  title: string
  content: string
  tags: string[]
}

export type UnifiedKnowledgeModel = {
  meta: {
    propertyId: string
    propertyName: string
    slug: string
    city: string
    country: string
    address: string
  }
  stay: {
    checkinTime: string
    checkoutTime: string
    checkinInstructions: string
    lockboxCode: string
    wifiName: string
    wifiPassword: string
    emergencyNumbers: string
    contacts: string[]
  }
  guestPage: {
    heroTitle: string
    heroIntro: string
    aboutTitle: string
    aboutIntro: string
    aboutDescription: string
    aboutHighlights: string
  }
  welcomeBook: {
    description: string
    amenities: string
    houseRules: string
    apartmentInstructions: string
    kitchen: string
    washingMachine: string
    towelsLinen: string
    beachTowels: string
    parking: string
    trash: string
    ac: string
    boiler: string
    restaurants: string
    transport: string
    localGuide: string
    emergency: string
    checkoutNotes: string
    extraNotes: string
  }
  localGuide: {
    neighbourhoodOverview: string
    restaurants: string
    breakfastCoffee: string
    bars: string
    beaches: string
    thingsToVisit: string
    transportGettingAround: string
    usefulServices: string
    hostRecommendations: string
  }
  extraServices: {
    enabled: boolean
    title: string
    intro: string
    services: string
    hostNote: string
  }
  aiTraining: {
    faq: string
    troubleshooting: string
    guestStyle: string
    complaintHandling: string
    escalationRules: string
    hiddenNotes: string
    additionalNotes: string
  }
  italianCompliance: {
    enabled: boolean
    guestFacingNotes: string
  }
}

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function safeBoolean(value: unknown) {
  return value === true
}

function safeArray(values: unknown) {
  if (!Array.isArray(values)) {
    return [] as string[]
  }

  return values
    .map((item) => safeText(item))
    .filter(Boolean)
}

function readMapValue(map: StringMap | undefined, key: string) {
  if (!map) {
    return ""
  }

  return safeText(map[key])
}

function firstNonEmpty(values: unknown[]) {
  for (const value of values) {
    const candidate = safeText(value)
    if (candidate) {
      return candidate
    }
  }

  return ""
}

function uniqueNonEmpty(values: string[]) {
  const seen = new Set<string>()
  const unique: string[] = []

  for (const value of values) {
    const clean = value.trim()
    if (!clean) {
      continue
    }

    const key = clean.toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    unique.push(clean)
  }

  return unique
}

function mergeTextAsParagraphs(values: string[]) {
  return uniqueNonEmpty(values).join("\n\n")
}

function mergeTextAsLines(values: string[]) {
  return uniqueNonEmpty(values).join("\n")
}

export function buildUnifiedKnowledgeModel(property: LegacyPromptProperty): UnifiedKnowledgeModel {
  const knowledgeBase = property.knowledge_base || {}
  const guestPage = knowledgeBase.guest_page
  const welcomeBook = knowledgeBase.welcome_book
  const localGuide = knowledgeBase.local_guide
  const extraServices = knowledgeBase.extra_services
  const aiTraining = knowledgeBase.ai_training
  const italianCompliance = knowledgeBase.italian_compliance

  const propertyName = firstNonEmpty([
    property.property_name,
    readMapValue(guestPage, "hero_title"),
    "Untitled property",
  ])

  return {
    meta: {
      propertyId: safeText(property.id),
      propertyName,
      slug: safeText(property.slug),
      city: safeText(property.city),
      country: safeText(property.country),
      address: safeText(property.address),
    },
    stay: {
      checkinTime: safeText(property.checkin_time),
      checkoutTime: safeText(property.checkout_time),
      checkinInstructions: safeText(property.checkin_instructions),
      lockboxCode: safeText(property.lockbox_code),
      wifiName: safeText(property.wifi_name),
      wifiPassword: safeText(property.wifi_password),
      emergencyNumbers: mergeTextAsParagraphs([
        safeText(property.emergency_numbers),
        safeText(property.emergency_info),
        readMapValue(welcomeBook, "emergency"),
      ]),
      contacts: safeArray(property.contacts),
    },
    guestPage: {
      heroTitle: firstNonEmpty([readMapValue(guestPage, "hero_title"), propertyName]),
      heroIntro: readMapValue(guestPage, "hero_intro"),
      aboutTitle: firstNonEmpty([readMapValue(guestPage, "about_title"), "About this stay"]),
      aboutIntro: readMapValue(guestPage, "about_intro"),
      aboutDescription: firstNonEmpty([
        readMapValue(guestPage, "about_description"),
        readMapValue(welcomeBook, "description"),
        property.description,
      ]),
      aboutHighlights: readMapValue(guestPage, "about_highlights"),
    },
    welcomeBook: {
      description: firstNonEmpty([readMapValue(welcomeBook, "description"), property.description]),
      amenities: firstNonEmpty([readMapValue(welcomeBook, "amenities"), property.amenities]),
      houseRules: firstNonEmpty([readMapValue(welcomeBook, "house_rules"), property.house_rules]),
      apartmentInstructions: readMapValue(welcomeBook, "apartment_instructions"),
      kitchen: readMapValue(welcomeBook, "kitchen"),
      washingMachine: readMapValue(welcomeBook, "washing_machine"),
      towelsLinen: readMapValue(welcomeBook, "towels_linen"),
      beachTowels: readMapValue(welcomeBook, "beach_towels"),
      parking: firstNonEmpty([readMapValue(welcomeBook, "parking"), property.parking_info]),
      trash: readMapValue(welcomeBook, "trash"),
      ac: readMapValue(welcomeBook, "ac"),
      boiler: readMapValue(welcomeBook, "boiler"),
      restaurants: readMapValue(welcomeBook, "restaurants"),
      transport: readMapValue(welcomeBook, "transport"),
      localGuide: firstNonEmpty([readMapValue(welcomeBook, "local_guide"), property.local_info]),
      emergency: mergeTextAsParagraphs([
        readMapValue(welcomeBook, "emergency"),
        safeText(property.emergency_info),
        safeText(property.emergency_numbers),
      ]),
      checkoutNotes: readMapValue(welcomeBook, "checkout_notes"),
      extraNotes: readMapValue(welcomeBook, "extra_notes"),
    },
    localGuide: {
      neighbourhoodOverview: firstNonEmpty([
        readMapValue(localGuide, "neighbourhood_overview"),
        property.local_info,
      ]),
      restaurants: mergeTextAsParagraphs([
        readMapValue(localGuide, "restaurants"),
        readMapValue(welcomeBook, "restaurants"),
      ]),
      breakfastCoffee: readMapValue(localGuide, "breakfast_coffee"),
      bars: readMapValue(localGuide, "bars"),
      beaches: readMapValue(localGuide, "beaches"),
      thingsToVisit: readMapValue(localGuide, "things_to_visit"),
      transportGettingAround: mergeTextAsParagraphs([
        readMapValue(localGuide, "transport_getting_around"),
        readMapValue(welcomeBook, "transport"),
      ]),
      usefulServices: readMapValue(localGuide, "useful_services"),
      hostRecommendations: mergeTextAsParagraphs([
        readMapValue(localGuide, "host_recommendations"),
        readMapValue(welcomeBook, "local_guide"),
      ]),
    },
    extraServices: {
      enabled: safeBoolean(extraServices?.enabled),
      title: firstNonEmpty([readMapValue(extraServices, "title"), "Extra Services"]),
      intro: readMapValue(extraServices, "intro"),
      services: readMapValue(extraServices, "services"),
      hostNote: readMapValue(extraServices, "host_note"),
    },
    aiTraining: {
      faq: firstNonEmpty([readMapValue(aiTraining, "faq"), property.ai_knowledge]),
      troubleshooting: readMapValue(aiTraining, "troubleshooting"),
      guestStyle: readMapValue(aiTraining, "guest_style"),
      complaintHandling: readMapValue(aiTraining, "complaint_handling"),
      escalationRules: readMapValue(aiTraining, "escalation_rules"),
      hiddenNotes: readMapValue(aiTraining, "hidden_notes"),
      additionalNotes: readMapValue(aiTraining, "additional_notes"),
    },
    italianCompliance: {
      enabled: safeBoolean(italianCompliance?.enabled),
      guestFacingNotes: mergeTextAsLines(
        uniqueNonEmpty([
          readMapValue(italianCompliance, "guest_notes"),
          readMapValue(italianCompliance, "guest_identity_notes"),
          readMapValue(italianCompliance, "tourist_tax_notes"),
        ])
      ),
    },
  }
}

export function buildKnowledgeDocuments(model: UnifiedKnowledgeModel): KnowledgeDocument[] {
  const docs: KnowledgeDocument[] = []

  const push = (id: string, title: string, content: string, tags: string[]) => {
    const clean = safeText(content)
    if (!clean) {
      return
    }

    docs.push({
      id,
      title,
      content: clean,
      tags,
    })
  }

  push(
    "property-core",
    "Property Core",
    [
      `Property name: ${model.meta.propertyName}`,
      model.meta.city ? `City: ${model.meta.city}` : "",
      model.meta.country ? `Country: ${model.meta.country}` : "",
      model.meta.address ? `Address: ${model.meta.address}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    ["property", "core"]
  )

  push(
    "stay-operations",
    "Stay Operations",
    [
      model.stay.checkinTime ? `Check-in time: ${model.stay.checkinTime}` : "",
      model.stay.checkoutTime ? `Check-out time: ${model.stay.checkoutTime}` : "",
      model.stay.checkinInstructions
        ? `Check-in instructions: ${model.stay.checkinInstructions}`
        : "",
      model.stay.wifiName ? `WiFi name: ${model.stay.wifiName}` : "",
      model.stay.wifiPassword ? `WiFi password: ${model.stay.wifiPassword}` : "",
      model.stay.emergencyNumbers
        ? `Emergency contacts: ${model.stay.emergencyNumbers}`
        : "",
      model.stay.contacts.length
        ? `Host contacts:\n${model.stay.contacts.join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    ["stay", "operations", "critical"]
  )

  push(
    "welcome-book",
    "Welcome Book",
    [
      model.welcomeBook.description,
      model.welcomeBook.amenities,
      model.welcomeBook.houseRules,
      model.welcomeBook.parking,
      model.welcomeBook.trash,
      model.welcomeBook.ac,
      model.welcomeBook.boiler,
      model.welcomeBook.checkoutNotes,
      model.welcomeBook.extraNotes,
    ]
      .filter(Boolean)
      .join("\n\n"),
    ["welcome-book", "operations", "guest-info"]
  )

  push(
    "local-guide",
    "Local Guide",
    [
      model.localGuide.neighbourhoodOverview,
      model.localGuide.restaurants,
      model.localGuide.breakfastCoffee,
      model.localGuide.bars,
      model.localGuide.beaches,
      model.localGuide.thingsToVisit,
      model.localGuide.transportGettingAround,
      model.localGuide.usefulServices,
      model.localGuide.hostRecommendations,
    ]
      .filter(Boolean)
      .join("\n\n"),
    ["local-guide", "recommendations", "guest-info"]
  )

  push(
    "extra-services",
    "Extra Services",
    [
      model.extraServices.title,
      model.extraServices.intro,
      model.extraServices.services,
      model.extraServices.hostNote,
    ]
      .filter(Boolean)
      .join("\n\n"),
    ["extra-services", "upsell"]
  )

  push(
    "ai-training",
    "AI Training",
    [
      model.aiTraining.faq,
      model.aiTraining.troubleshooting,
      model.aiTraining.guestStyle,
      model.aiTraining.complaintHandling,
      model.aiTraining.escalationRules,
      model.aiTraining.hiddenNotes,
      model.aiTraining.additionalNotes,
    ]
      .filter(Boolean)
      .join("\n\n"),
    ["ai-training", "internal"]
  )

  if (model.italianCompliance.enabled) {
    push(
      "italian-compliance",
      "Italian Compliance",
      model.italianCompliance.guestFacingNotes,
      ["compliance", "italy"]
    )
  }

  return docs
}

export function buildPromptReadyKnowledge(model: UnifiedKnowledgeModel) {
  const docs = buildKnowledgeDocuments(model)

  return {
    model,
    docs,
    compactContext: docs
      .map((doc) => `${doc.title}:\n${doc.content}`)
      .join("\n\n--------------------------------\n\n"),
  }
}