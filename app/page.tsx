"use client";

import { FormEvent, useEffect, useState } from "react";

// Yhden TODO-tehtävän rakenne.
// Jokaisella tehtävällä on oma pysyvä id, teksti ja completed-tila.
type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

// localStorage-avain pidetään yhdessä paikassa,
// jotta kirjoitusvirheitä ei synny eri kohdissa koodia.
const STORAGE_KEY = "todos";

// Tarkistaa, että localStoragesta luettu data näyttää oikealta Todo-listalta.
function isTodoArray(value: unknown): value is Todo[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item) => {
    if (typeof item !== "object" || item === null) {
      return false;
    }

    const todo = item as Record<string, unknown>;

    return (
      typeof todo.id === "string" &&
      typeof todo.text === "string" &&
      typeof todo.completed === "boolean"
    );
  });
}

export default function Home() {
  // Uuden tehtävän kirjoituskenttä.
  const [task, setTask] = useState("");

  // Kaikki TODO-tehtävät.
  const [todos, setTodos] = useState<Todo[]>([]);

  // Muokattavan tehtävän id.
  // null tarkoittaa, ettei mitään tehtävää muokata.
  const [editingId, setEditingId] = useState<string | null>(null);

  // Muokkauskentän tämänhetkinen teksti.
  const [editingText, setEditingText] = useState("");

  // Estää tyhjän listan tallentamisen ennen kuin localStorage on luettu.
  const [storageLoaded, setStorageLoaded] = useState(false);

  // Luetaan aiemmin tallennetut tehtävät selaimesta kerran käynnistyksen jälkeen.
useEffect(() => {
  // Siirretään state-päivitys seuraavaan event loop -kierrokseen.
  // Näin Reactin lint-sääntöä set-state-in-effect ei rikota.
  const timer = window.setTimeout(() => {
    const savedTodos = localStorage.getItem(STORAGE_KEY);

    if (savedTodos) {
      try {
        const parsedTodos: unknown = JSON.parse(savedTodos);

        // Tarkistetaan ensin, että tallennettu data on oikeassa muodossa.
        if (isTodoArray(parsedTodos)) {
          setTodos(parsedTodos);
        } else {
          console.warn(
            "Tallennetut TODO-tiedot olivat väärässä muodossa."
          );
        }
      } catch {
        console.warn(
          "Tallennettuja TODO-tehtäviä ei voitu lukea."
        );
      }
    }

    // Sallitaan localStorageen tallentaminen vasta lukemisen jälkeen.
    setStorageLoaded(true);
  }, 0);

  // Cleanup suoritetaan, jos komponentti poistuu ennen timeria.
  return () => window.clearTimeout(timer);
}, []);

  // Tallennetaan lista aina, kun tehtävät muuttuvat.
  useEffect(() => {
    if (!storageLoaded) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos, storageLoaded]);

  // Lisää uuden tehtävän.
  function addTodo(event: FormEvent<HTMLFormElement>) {
    // Estetään lomakkeen normaali sivun uudelleenlataus.
    event.preventDefault();

    const trimmedTask = task.trim();

    // Tyhjää tehtävää ei lisätä.
    if (!trimmedTask) {
      return;
    }

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: trimmedTask,
      completed: false,
    };

    // Funktionaalinen päivitys käyttää aina uusinta statea.
    setTodos((currentTodos) => [...currentTodos, newTodo]);

    // Tyhjennetään kirjoituskenttä onnistuneen lisäyksen jälkeen.
    setTask("");
  }

  // Vaihtaa tehtävän completed-tilan.
  function toggleTodo(id: string) {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    );
  }

  // Poistaa yhden tehtävän.
  function deleteTodo(id: string) {
    setTodos((currentTodos) =>
      currentTodos.filter((todo) => todo.id !== id)
    );

    // Jos poistettiin juuri muokattava tehtävä,
    // suljetaan samalla muokkaustila.
    if (editingId === id) {
      cancelEdit();
    }
  }

  // Avaa tehtävän muokkaustilaan.
  function startEditing(todo: Todo) {
    setEditingId(todo.id);
    setEditingText(todo.text);
  }

  // Tallentaa muokatun tekstin.
  function saveEdit(id: string) {
    const trimmedText = editingText.trim();

    // Tyhjää tekstiä ei tallenneta.
    if (!trimmedText) {
      return;
    }

    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id
          ? { ...todo, text: trimmedText }
          : todo
      )
    );

    cancelEdit();
  }

  // Peruuttaa muokkauksen.
  function cancelEdit() {
    setEditingId(null);
    setEditingText("");
  }

  // Poistaa kaikki valmiiksi merkityt tehtävät.
  function clearCompleted() {
    setTodos((currentTodos) =>
      currentTodos.filter((todo) => !todo.completed)
    );

    // Jos muokattava tehtävä poistui clear-toiminnolla,
    // suljetaan muokkaustila.
    if (
      editingId &&
      todos.some((todo) => todo.id === editingId && todo.completed)
    ) {
      cancelEdit();
    }
  }

  // Poistaa kaikki tehtävät.
  function clearAll() {
    setTodos([]);
    cancelEdit();
  }

  // Lasketaan valmiiksi merkityt tehtävät.
  const completedCount = todos.filter((todo) => todo.completed).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-8">
      <section className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        {/* Sovelluksen otsikko */}
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            TODO
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Simple React task manager
          </p>
        </header>

        {/* Completed-laskuri */}
        <div className="mb-6 text-center">
          <p className="text-lg font-medium text-gray-800">
            {completedCount} / {todos.length} completed
          </p>
        </div>

        {/* Uuden tehtävän lomake */}
        <form onSubmit={addTodo} className="mb-6 flex gap-2">
          <label htmlFor="new-task" className="sr-only">
            New task
          </label>

          <input
            id="new-task"
            type="text"
            value={task}
            onChange={(event) => setTask(event.target.value)}
            placeholder="Write your task..."
            autoComplete="off"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <button
            type="submit"
            className="rounded-lg bg-black px-5 py-2 font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Add
          </button>
        </form>

        {/* TODO-lista */}
        <div className="space-y-2">
          {todos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-5 text-center text-gray-500">
              No todos yet.
            </p>
          ) : (
            todos.map((todo) => (
              <article
                key={todo.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm"
              >
                {/* Muokkaustila */}
                {editingId === todo.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label htmlFor={`edit-${todo.id}`} className="sr-only">
                      Edit task
                    </label>

                    <input
                      id={`edit-${todo.id}`}
                      type="text"
                      value={editingText}
                      onChange={(event) =>
                        setEditingText(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          saveEdit(todo.id);
                        }

                        if (event.key === "Escape") {
                          cancelEdit();
                        }
                      }}
                      autoFocus
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />

                    <button
                      type="button"
                      onClick={() => saveEdit(todo.id)}
                      className="rounded-lg bg-green-600 px-3 py-2 text-white transition hover:bg-green-700"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg bg-gray-500 px-3 py-2 text-white transition hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {/* Completed-checkbox */}
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      aria-label={`Mark "${todo.text}" as ${
                        todo.completed ? "not completed" : "completed"
                      }`}
                      className="h-4 w-4 shrink-0"
                    />

                    {/* Tehtävän teksti */}
                    <span
                      className={
                        todo.completed
                          ? "min-w-0 flex-1 break-words text-gray-400 line-through"
                          : "min-w-0 flex-1 break-words text-gray-900"
                      }
                    >
                      {todo.text}
                    </span>

                    {/* Edit-painike */}
                    <button
                      type="button"
                      onClick={() => startEditing(todo)}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-white transition hover:bg-blue-700"
                    >
                      Edit
                    </button>

                    {/* Delete-painike */}
                    <button
                      type="button"
                      onClick={() => deleteTodo(todo.id)}
                      className="rounded-lg bg-red-600 px-3 py-2 text-white transition hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        {/* Listan hallintapainikkeet */}
        {todos.length > 0 && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={clearCompleted}
              disabled={completedCount === 0}
              className="rounded-lg bg-slate-600 px-4 py-2 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear completed
            </button>

            <button
              type="button"
              onClick={clearAll}
              className="rounded-lg bg-red-700 px-4 py-2 text-white transition hover:bg-red-800"
            >
              Clear all
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
