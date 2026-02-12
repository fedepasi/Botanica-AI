# Botanica-AI: Homepage UX Refactoring
## Task #22 - Design Document

---

## 🎯 Problema Attuale

La homepage attuale mostra task in sezioni temporali:
- Overdue
- Botanica Advisor (pruning/grafting)
- This Week
- This Month
- Upcoming

**Problema:** Con tante piante, la homepage diventa uno scroll infinito con task sovrapposti. L'utente perde la visione d'insieme delle lavorazioni da fare.

---

## ✅ Soluzione Proposta: Raggruppamento per Tipo di Lavorazione

### Concept
Invece di raggruppare per **tempo**, raggruppiamo per **tipo di lavorazione**. Ogni macro-categoria diventa una card espandibile con le piante che necessitano di quella specifica lavorazione.

---

## 📐 Struttura Nuova Homepage

```
┌─────────────────────────────────────────┐
│  👤 Ciao, Federico!                     │
│  🌤️ 18°C, Soleggiato                    │
├─────────────────────────────────────────┤
│                                         │
│  🔴 LAVORAZIONI URGENTI (3)             │
│  ├─ ⚠️ Overdue: Potatura Melo (3gg)     │
│  ├─ ⚠️ Overdue: Concimazione Pero (5gg) │
│  └─ 🔥 Oggi: Trapianto Rosmarino        │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ✂️ POTATURA (2 piante)       [▼]       │
│  ├─ Melo - Potatura di formazione       │
│  │  └─ ☐ Task completato                │
│  │  └─ ☐ Ha bisogno di formazione...    │
│  └─ Pero - Potatura verde               │
│     └─ ☐ Rimuovi i succhioni            │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🌱 SEMINA (1 pianta)         [▼]       │
│  └─ Pomodori - Semina diretta           │
│     └─ ☐ Prepara semenzaio               │
│     └─ ☐ Note: Usare vaso grande         │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🧪 CONCIMATIONE (3 piante)   [▶]       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  💧 IRRIGAZIONE (5 piante)    [▶]       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🍎 RACCOLTA (2 piante)       [▼]       │
│  ├─ Fico - Pronto per raccolta          │
│  └─ Uva - Maturazione in corso          │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🐛 PREVENZIONE PARASSITI (4) [▶]       │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎨 Componenti UI

### 1. Header Section
```tsx
<HomeHeader>
  <WelcomeMessage user={user} />
  <WeatherDisplay weather={weather} />
  <UrgentBanner tasks={urgentTasks} /> {/* Se ci sono task overdue/oggi */}
</HomeHeader>
```

### 2. Category Accordion
```tsx
<WorkCategory
  category="pruning"
  icon="✂️"
  title="Potatura"
  count={2}
  isExpanded={true}
  onToggle={() => {}}
>
  <PlantWorkList plants={plantsInCategory}>
    {(plant) => (
      <PlantWorkCard
        plant={plant}
        tasks={plant.tasks}
        subtasks={plant.subtasks}
        onTaskComplete={handleComplete}
        onAddNote={handleAddNote}
      />
    )}
  </PlantWorkList>
</WorkCategory>
```

### 3. Subtask System
Ogni task ha subtask spuntabili:
```tsx
interface Subtask {
  id: string;
  taskId: string;
  content: string;
  completed: boolean;
  completedAt?: Date;
  note?: string; // User can add notes to subtasks
}
```

---

## 📊 Schema Dati

### Nuova Interfaccia TypeScript
```typescript
// Raggruppamento per categoria
interface TasksByCategory {
  category: TaskCategory;
  categoryLabel: string;
  icon: string;
  color: string;
  plantGroups: PlantTaskGroup[];
  totalTasks: number;
  urgentTasks: number;
  isExpanded: boolean;
}

// Gruppo di task per pianta
interface PlantTaskGroup {
  plantId: string;
  plantName: string;
  plantImage?: string;
  tasks: DisplayTask[];
  subtasks: Subtask[];
  hasNotes: boolean;
}

// Subtask per tracciare cronologia
interface Subtask {
  id: string;
  taskId: string;
  plantId: string;
  content: string;
  completed: boolean;
  completedAt?: string;
  userNote?: string;
  createdAt: string;
}
```

---

## 🔄 Hook: useGroupedTasks

```typescript
// hooks/useGroupedTasks.ts
export const useGroupedTasks = () => {
  const { tasks } = useCareplan();
  const [expandedCategories, setExpandedCategories] = useState<Set<TaskCategory>>(
    () => new Set(['pruning', 'watering']) // Default expanded
  );

  const groupedTasks = useMemo(() => {
    const groups = new Map<TaskCategory, TasksByCategory>();
    
    tasks.forEach(task => {
      const group = groups.get(task.category) || createEmptyGroup(task.category);
      group.totalTasks++;
      if (task.timing === 'overdue' || task.timing === 'today') {
        group.urgentTasks++;
      }
      
      // Find or create plant group
      let plantGroup = group.plantGroups.find(p => p.plantId === task.plantId);
      if (!plantGroup) {
        plantGroup = { plantId: task.plantId, plantName: task.plantName, tasks: [], subtasks: [] };
        group.plantGroups.push(plantGroup);
      }
      plantGroup.tasks.push(task);
    });

    return Array.from(groups.values()).sort((a, b) => b.urgentTasks - a.urgentTasks);
  }, [tasks]);

  const toggleCategory = (category: TaskCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  return { groupedTasks, expandedCategories, toggleCategory };
};
```

---

## 📱 Wireframe Dettagliato

### Mobile View (principale)
 
```
┌─────────────────────────┐
│  👤 Ciao, Federico!     │
│  🌤️ 18°C | Soleggiato    │
├─────────────────────────┤
│ 🔴 3 URGENTI             │
│ • Melo: Potatura (-3gg) │
│ • Pero: Concima (-5gg)  │
│ • Rosm: Trapianto (oggi)│
├─────────────────────────┤
│ ✂️ POTATURA (2) ▼        │
│ ─────────────────────   │
│ 🍎 Melo                 │
│ ☐ Potatura formazione   │
│ ☐ Taglia rami secchi    │
│ ☐ Note: Usare sega pulita│
│ ─────────────────────   │
│ 🍐 Pero                 │
│ ☐ Potatura verde        │
│ ☐ Rimuovi succhioni     │
├─────────────────────────┤
│ 💧 IRRIGAZIONE (5) ▶    │
├─────────────────────────┤
│ 🧪 CONCIMATIONE (3) ▶   │
├─────────────────────────┤
│ 🍎 RACCOLTA (2) ▶       │
├─────────────────────────┤
│ 🌱 SEMINA (1) ▶         │
├─────────────────────────┤
│ 🐛 PARASSITI (0) ▶      │
├─────────────────────────┤
│ ✅ COMPLETATI (8)       │
└─────────────────────────┘
```

---

## 🗄️ Database Migration

```sql
-- Tabella subtasks per tracciare dettagli lavorazioni
CREATE TABLE botanica_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES botanica_tasks(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES botanica_plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  user_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indici
CREATE INDEX idx_subtasks_task ON botanica_subtasks(task_id);
CREATE INDEX idx_subtasks_plant ON botanica_subtasks(plant_id);
CREATE INDEX idx_subtasks_user ON botanica_subtasks(user_id);

-- RLS
ALTER TABLE botanica_subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own subtasks" ON botanica_subtasks
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER trigger_subtasks_updated_at
  BEFORE UPDATE ON botanica_subtasks
  FOR EACH ROW EXECUTE FUNCTION update_botanica_tasks_updated_at();
```

---

## 🎨 Colori e Stili

| Categoria | Colore | Icona |
|-----------|--------|-------|
| Pruning | 🟣 Purple | ✂️ |
| Grafting | 🟠 Orange | 🔗 |
| Watering | 🔵 Blue | 💧 |
| Fertilizing | 🟢 Green | 🧪 |
| Harvesting | 🟡 Yellow | 🍎 |
| Pest Prevention | 🔴 Red | 🐛 |
| Seeding | 🟢 Emerald | 🌱 |
| Repotting | 🟤 Amber | 🪴 |
| General | ⚪ Gray | 🌿 |

---

## 🚀 Implementation Roadmap

### Fase 1: Backend (già parziale)
- [x] Edge function JSON strutturato
- [ ] Migration subtasks table
- [ ] API endpoints per subtasks

### Fase 2: Frontend Core
- [ ] Hook useGroupedTasks
- [ ] Componente WorkCategory
- [ ] Componente PlantWorkCard
- [ ] Subtask checklist component

### Fase 3: UX Polish
- [ ] Animazioni expand/collapse
- [ ] Persist stato expanded in localStorage
- [ ] Pull-to-refresh
- [ ] Empty states

### Fase 4: Advanced
- [ ] Drag & drop subtasks
- [ ] Quick-add note inline
- [ ] Filter by plant

---

## 💡 Vantaggi

1. **Visione d'insieme**: Vedo subito quali lavorazioni devo fare oggi
2. **Focus**: Posso concentrarmi su una categoria alla volta
3. **Scalabilità**: Con 20 piante non diventa un muro di testo
4. **Tracciamento**: I subtask permettono di annotare dettagli
5. **Storico**: Le note associate ai subtask creano cronologia

---

*Documento creato per Task #22 - Botanica-AI Homepage UX Refactoring*
