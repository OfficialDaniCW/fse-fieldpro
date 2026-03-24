import { useContext } from "react";
import { ConnectionBannerContext } from "../lib/ConnectionBannerContext";
import GlobalSearchBar from "./GlobalSearchBar";

export default function PageHeader({ title, subtitle, children, hideSearch = false }) {
  const banner = useContext(ConnectionBannerContext) || null;

  return (
    <div className="flex-shrink-0">
      <div className="bg-[#CC0000] shadow-md px-4 pt-10 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-[#CC0000]">FSE</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-white leading-tight">{title}</h1>
              {subtitle && <p className="text-xs text-red-200 font-normal opacity-90">{subtitle}</p>}
            </div>
          </div>
          {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
        {!hideSearch && <GlobalSearchBar />}
      </div>
      {banner}
    </div>
  );
}