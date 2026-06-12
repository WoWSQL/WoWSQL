/**
 * WoWSQL Self-Hosted — JavaScript Quickstart
 * ============================================
 *
 * Prerequisites:
 *   npm install @wowsql/js
 *
 * Make sure WoWSQL is running:
 *   cd docker && docker compose up -d
 */

import { createClient } from '@wowsql/js';

// Connect to your self-hosted WoWSQL instance
const db = createClient(
  'http://localhost:8080',                           // Kong API gateway
  'wowsql_anon_change_me_to_a_random_string'        // Your anon key from .env
);

async function main() {
  // ─── Read data ───────────────────────────────────────
  console.log('Reading todos...');
  const { data: todos, error } = await db
    .from('todos')
    .select('*');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log(`Found ${todos.length} todos`);
  todos.forEach(todo => {
    const status = todo.completed ? '✓' : '○';
    console.log(`  ${status} ${todo.title}`);
  });

  // ─── Insert data ─────────────────────────────────────
  console.log('\nAdding a new todo...');
  const { data: newTodo } = await db
    .from('todos')
    .insert({ title: 'Try WoWSQL self-hosted', completed: false })
    .select()
    .single();

  console.log(`Created: ${newTodo.title}`);

  // ─── Update data ─────────────────────────────────────
  console.log('\nMarking it as done...');
  await db
    .from('todos')
    .update({ completed: true })
    .eq('title', 'Try WoWSQL self-hosted');

  console.log('Updated!');

  // ─── Realtime subscription ───────────────────────────
  console.log('\nSubscribing to realtime changes...');
  const channel = db
    .channel('todos-changes')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'todos' },
      (payload) => console.log('New todo:', payload.new)
    )
    .subscribe();

  console.log('Listening for new todos... (Ctrl+C to stop)');

  // Keep alive for demo
  await new Promise(resolve => setTimeout(resolve, 30000));
  channel.unsubscribe();
}

main().catch(console.error);
