"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { collection, addDoc, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase-client"

export interface Option {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  collectionName?: string
  createNew?: boolean
  label: string
  className?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search...",
  collectionName,
  createNew = true,
  label,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [newItemValue, setNewItemValue] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)

  const handleCreateNew = async () => {
    if (!collectionName || !newItemValue.trim()) return

    try {
      // Check if the item already exists
      const itemQuery = query(collection(db, collectionName), where("name", "==", newItemValue.trim()))
      const querySnapshot = await getDocs(itemQuery)

      if (!querySnapshot.empty) {
        // Item already exists, use its value
        const existingDoc = querySnapshot.docs[0]
        onChange(existingDoc.id)
        setOpen(false)
        setSearchValue("")
        setIsCreating(false)
        setNewItemValue("")
        return
      }

      // Create new item in Firebase
      const docRef = await addDoc(collection(db, collectionName), {
        name: newItemValue.trim(),
        createdAt: new Date(),
      })

      // Use the new item
      onChange(docRef.id)
      setOpen(false)
      setSearchValue("")
      setIsCreating(false)
      setNewItemValue("")
    } catch (error) {
      console.error("Error creating new item:", error)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {selectedOption ? selectedOption.label : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          {isCreating ? (
            <div className="flex flex-col p-2">
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter new value..."
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreateNew}>
                  Create
                </Button>
              </div>
            </div>
          ) : (
            <Command>
              <CommandInput placeholder={placeholder} value={searchValue} onValueChange={setSearchValue} />
              <CommandList>
                <CommandEmpty>
                  {createNew ? (
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setIsCreating(true)
                        setNewItemValue(searchValue)
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create "{searchValue}"
                    </Button>
                  ) : (
                    "No results found."
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onChange(option.value)
                        setOpen(false)
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {createNew && searchValue && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setIsCreating(true)
                          setNewItemValue(searchValue)
                        }}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create "{searchValue}"
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

