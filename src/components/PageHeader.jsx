import React from "react";

export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="bg-[#CC0000] shadow-md px-4 pt-4 pb-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-extrabold text-[#CC0000] tracking-tight">FSE</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-red-200 font-medium">{subtitle}</p>}
          </div>
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}