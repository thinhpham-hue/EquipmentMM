import React, { useRef } from 'react';

export default function ProjectTabs({ projects, activeYear, activeProjectId, onSelectProject, onOpenAddModal }) {
  const scrollRef = useRef(null);

  const handleWheel = (e) => {
    if (scrollRef.current && e.deltaY !== 0) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const filteredProjects = projects.filter((p) => String(p.year) === String(activeYear));

  return (
    <div
      ref={scrollRef}
      onWheel={handleWheel}
      className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 scrollbar-none flex-1 max-w-[calc(100%-44px)]"
    >
      {filteredProjects.map((proj) => {
        const isActive = proj.id === activeProjectId;
        const borrowedCount = proj.items ? proj.items.filter((i) => i.status === 'BORROWED').length : 0;

        return (
          <button
            key={proj.id}
            onClick={() => onSelectProject(proj.id)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
              isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span className="truncate max-w-[100px]">{proj.name}</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-300'}`}>
              {borrowedCount}
            </span>
          </button>
        );
      })}

      <button
        onClick={onOpenAddModal}
        className="px-2 py-1.5 rounded-xl text-xs font-bold bg-slate-950 text-blue-400 border border-slate-800 hover:bg-slate-800 transition-all flex-shrink-0"
      >
        + Dự án
      </button>
    </div>
  );
}