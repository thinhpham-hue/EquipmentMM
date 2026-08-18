import React from 'react';

export default function SdCardPanel({
  panelState,
  togglePanel,
  sdSearch,
  setSdSearch,
  sdTypeTab,
  setSdTypeTab,
  sdCapacityFilter,
  setSdCapacityFilter,
  filteredSDCards,
  sdCardList,
  handleDropOnPool,
  getProjectName
}) {
  return (
    <section className={`workspace-panel ${panelState.right ? 'w-14 min-w-[56px]' : 'flex-1 min-w-[280px]'} bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative shadow-2xl`}>
      {!panelState.right ? (
        <>
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                <i className="fa-solid fa-sd-card"></i>
              </div>
              <div>
                <h2 className="font-extrabold text-white text-xs uppercase tracking-wider">SD Card</h2>
              </div>
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  value={sdSearch}
                  onChange={(e) => setSdSearch(e.target.value)}
                  placeholder=""
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <button onClick={() => togglePanel('right')} className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 flex-shrink-0 cursor-pointer border-2 border-rose-400/40 active:scale-90 transition-all">
              <i className="fa-solid fa-minus text-xs"></i>
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden p-3">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 mb-2.5">
              <button
                onClick={() => setSdTypeTab('VIDEO')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${sdTypeTab === 'VIDEO' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                <i className="fa-solid fa-video text-[9px]"></i>
                <span>Thẻ Quay</span>
              </button>
              <button
                onClick={() => setSdTypeTab('AUDIO')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${sdTypeTab === 'AUDIO' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                <i className="fa-solid fa-microphone text-[9px]"></i>
                <span>Thẻ Âm Thanh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 mb-3">
              <select
                value={sdCapacityFilter}
                onChange={(e) => setSdCapacityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Tất cả dung lượng</option>
                <option value="128GB">128 GB</option>
                <option value="256GB">256 GB</option>
                <option value="32GB">32 GB (Audio)</option>
              </select>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnPool}
              className="flex-1 overflow-y-auto space-y-2 pr-1 transition-all"
            >
              {filteredSDCards.length === 0 ? (
                <div className="text-center p-6 text-slate-500 text-xs">
                  <i className="fa-solid fa-sd-card text-xl mb-1 block"></i>Không tìm thấy thẻ nhớ
                </div>
              ) : (
                filteredSDCards.map(card => {
                  const isAvail = card.status === true;
                  const isVideo = card.isVideoCard !== false;

                  return (
                    <div
                      key={card.id}
                      draggable={isAvail}
                      onDragStart={(e) => {
                        const payload = { type: 'SD_TO_PROJECT', cardId: card.id };
                        e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                      }}
                      className={`bg-slate-900 border ${isAvail ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800 opacity-60'} p-2.5 rounded-xl transition-all`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-indigo-400 text-xs truncate">{card.id}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${isVideo ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                              {isVideo ? 'Thẻ Quay' : 'Âm Thanh'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {card.capacity}
                            </span>
                            {!isAvail && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Đang ở: {getProjectName(card.currentProject)}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{card.note}</div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isAvail && (
                            <div className="p-1 text-slate-600 hover:text-indigo-400 cursor-grab text-xs">
                              <i className="fa-solid fa-grip-vertical"></i>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Khả dụng: <strong className="text-emerald-400 font-mono font-bold">{sdCardList.filter(i => i.status === true || i.status === 'AVAILABLE' || i.status === 'true').length}</strong> | Đang dùng: <strong className="text-indigo-400 font-mono font-bold">{sdCardList.filter(i => i.status === false || i.status === 'UNAVAILABLE' || i.status === 'false').length}</strong></span>
            </div>
          </div>
        </>
      ) : (
        <div
          onClick={() => togglePanel('right')}
          className="flex-1 flex flex-col items-center justify-between p-3 my-2 mx-auto w-11 bg-slate-950 border border-slate-800 rounded-3xl cursor-pointer hover:border-indigo-500/60 hover:bg-indigo-950/20 transition-all group shadow-xl"
        >
          <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all flex-shrink-0 border border-indigo-500/30">
            <i className="fa-solid fa-arrows-left-right text-xs"></i>
          </div>
          <div className="writing-mode-vertical text-[11px] font-extrabold text-slate-300 tracking-widest uppercase my-auto py-3 select-none group-hover:text-indigo-300">
            THẺ NHỚ
          </div>
          <div className="font-mono font-black text-xs text-indigo-400 bg-indigo-950/50 px-1.5 py-0.5 rounded-full border border-indigo-800/40 flex-shrink-0">
            {sdCardList.length}
          </div>
        </div>
      )}
    </section>
  );
}