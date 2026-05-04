import { createClient } from "@/utils/supabase/server";

type Todo = {
  id: string | number;
  name: string;
};

export default async function SupabaseTestPage() {
  const supabase = await createClient();
  const { data: todos, error } = await supabase.from("todos").select("id, name");

  if (error) {
    return <p>Failed to load todos: {error.message}</p>;
  }

  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Supabase Todos</h1>
      <ul className="list-disc pl-6">
        {todos?.map((todo: Todo) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
    </main>
  );
}
