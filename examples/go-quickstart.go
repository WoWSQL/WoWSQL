/*
WoWSQL Self-Hosted — Go Quickstart
====================================

Prerequisites:
  go get github.com/wowsql/wowsql-go

Make sure WoWSQL is running:
  cd docker && docker compose up -d
*/

package main

import (
	"fmt"
	"log"

	"github.com/wowsql/wowsql-go"
)

type Todo struct {
	ID        int    `json:"id"`
	Title     string `json:"title"`
	Completed bool   `json:"completed"`
	CreatedAt string `json:"created_at"`
}

func main() {
	// Connect to your self-hosted WoWSQL instance
	db := wowsql.NewClient(
		"http://localhost:8080",                      // Kong API gateway
		"wowsql_anon_change_me_to_a_random_string",  // Your anon key from .env
	)

	// ─── Read data ───────────────────────────────────────
	fmt.Println("Reading todos...")
	var todos []Todo
	err := db.From("todos").Select("*").Execute(&todos)
	if err != nil {
		log.Fatal("Error reading todos:", err)
	}

	fmt.Printf("Found %d todos\n", len(todos))
	for _, todo := range todos {
		status := "○"
		if todo.Completed {
			status = "✓"
		}
		fmt.Printf("  %s %s\n", status, todo.Title)
	}

	// ─── Insert data ─────────────────────────────────────
	fmt.Println("\nAdding a new todo...")
	err = db.From("todos").Insert(map[string]any{
		"title":     "Try WoWSQL from Go",
		"completed": false,
	}).Execute(nil)
	if err != nil {
		log.Fatal("Error inserting:", err)
	}
	fmt.Println("Created!")

	// ─── Update data ─────────────────────────────────────
	fmt.Println("\nMarking it as done...")
	err = db.From("todos").
		Update(map[string]any{"completed": true}).
		Eq("title", "Try WoWSQL from Go").
		Execute(nil)
	if err != nil {
		log.Fatal("Error updating:", err)
	}
	fmt.Println("Updated!")

	// ─── Filter query ────────────────────────────────────
	fmt.Println("\nCompleted todos:")
	var completed []Todo
	err = db.From("todos").Select("*").Eq("completed", "true").Execute(&completed)
	if err != nil {
		log.Fatal("Error:", err)
	}
	for _, todo := range completed {
		fmt.Printf("  ✓ %s\n", todo.Title)
	}

	fmt.Println("\nDone! Your self-hosted WoWSQL is working perfectly.")
}
