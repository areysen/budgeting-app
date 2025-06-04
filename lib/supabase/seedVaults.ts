import { supabase } from "./client"

const defaultVaults = [
  "Roundup",
  "Rent",
  "Emergency Fund",
  "Dog Supplies",
  "Dog Food",
  "Miscellaneous",
  "Groceries",
  "Car Insurance",
  "Lawncare",
]

export async function seedVaults(userId: string) {
  const { data, error } = await supabase
    .from("vaults")
    .insert(defaultVaults.map(name => ({ name, user_id: userId })))

  if (error) {
    console.error("Error seeding vaults:", error.message)
  } else {
    console.log("Vaults seeded:", data)
  }
}