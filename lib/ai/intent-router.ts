export function detectIntent(message: string) {

  const text = message.toLowerCase()

  if (
    text.includes("broken") ||
    text.includes("not working") ||
    text.includes("problem")
  ) {
    return "complaint"
  }

  if (
    text.includes("restaurant") ||
    text.includes("food") ||
    text.includes("bar")
  ) {
    return "recommendation"
  }

  if (
    text.includes("taxi") ||
    text.includes("airport") ||
    text.includes("transfer")
  ) {
    return "service"
  }

  return "question"

}