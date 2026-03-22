import React, { useState, useMemo } from "react";
import { BookOpen, Package, Zap, Box, MoreHorizontal, ChevronRight, ChevronDown } from "lucide-react";

// Smart grouping logic: organizes manuals by brand, then by component type
function groupManualsByBrandAndComponent(manuals) {
  const grouped = {};

  manuals.forEach(manual => {
    const brand = manual.equipment_manufacturer || "Unknown";
    
    if (!grouped[brand]) {
      grouped[brand] = {
        hydraulic: [],
        electrical: [],
        mechanical: [],
        parts: [],
        miscellaneous: []
      };
    }

    // Infer component type from title, model, or system_area
    const text = `${manual.title} ${manual.equipment_model || ""} ${manual.summary || ""}`.toLowerCase();
    
    if (text.match(/hydraulic|pump|hose|valve|flow/)) {
      grouped[brand].hydraulic.push(manual);
    } else if (text.match(/electric|motor|switch|relay|circuit|power|sensor/)) {
      grouped[brand].electrical.push(manual);
    } else if (text.match(/gear|bearing|shaft|coupling|brake|clutch/)) {
      grouped[brand].mechanical.push(manual);
    } else if (text.match(/part|component|seal|gasket|ring|filter/)) {
      grouped[brand].parts.push(manual);
    } else {
      grouped[brand].miscellaneous.push(manual);
    }
  });

  // Filter out empty categories
  Object.keys(grouped).forEach(brand => {
    Object.keys(grouped[brand]).forEach(category => {
      if (grouped[brand][category].length === 0) {
        delete grouped[brand][category];
      }
    });
  });

  return grouped;
}

const COMPONENT_INFO = {
  hydraulic: {
    icon: "💧",
    label: "Hydraulic Systems",
    color: "bg-blue-50 border-blue-200 text-blue-900",
    badge: "bg-blue-100 text-blue-700"
  },
  electrical: {
    icon: "⚡",
    label: "Electrical Systems",
    color: "bg-yellow-50 border-yellow-200 text-yellow-900",
    badge: "bg-yellow-100 text-yellow-700"
  },
  mechanical: {
    icon: "⚙️",
    label: "Mechanical Systems",
    color: "bg-purple-50 border-purple-200 text-purple-900",
    badge: "bg-purple-100 text-purple-700"
  },
  parts: {
    icon: "📦",
    label: "Parts & Components",
    color: "bg-green-50 border-green-200 text-green-900",
    badge: "bg-green-100 text-green-700"
  },
  miscellaneous: {
    icon: "📄",
    label: "Miscellaneous",
    color: "bg-gray-50 border-gray-200 text-gray-900",
    badge: "bg-gray-100 text-gray-700"
  }
};

export default function ManualOrganizer({ manuals, onSelectManual }) {
  const [expandedBrands, setExpandedBrands] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  const grouped = useMemo(() => groupManualsByBrandAndComponent(manuals), [manuals]);

  const toggleBrand = (brand) => {
    setExpandedBrands(prev => ({
      ...prev,
      [brand]: !prev[brand]
    }));
  };

  const toggleCategory = (brand, category) => {
    const key = `${brand}::${category}`;
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (Object.keys(grouped).length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No manuals found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([brand, categories]) => {
        const brandOpen = expandedBrands[brand] !== false;
        const totalManuals = Object.values(categories).reduce((sum, items) => sum + items.length, 0);

        return (
          <div key={brand} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Brand Header */}
            <button
              onClick={() => toggleBrand(brand)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#CC0000]/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-[#CC0000]" />
              </div>
              <div className="flex-1">
                <span className="font-semibold text-gray-800">{brand}</span>
                <span className="ml-2 text-xs text-gray-400">{totalManuals} manual{totalManuals !== 1 ? "s" : ""}</span>
              </div>
              {brandOpen ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {brandOpen && (
              <div className="border-t border-gray-100">
                {Object.entries(categories).map(([category, items], idx) => {
                  const info = COMPONENT_INFO[category];
                  const categoryKey = `${brand}::${category}`;
                  const categoryOpen = expandedCategories[categoryKey] !== false;

                  return (
                    <div key={category} className={idx < Object.keys(categories).length - 1 ? "border-b border-gray-100" : ""}>
                      {/* Category Sub-header */}
                      <button
                        onClick={() => toggleCategory(brand, category)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${info.color}`}
                      >
                        <span className="text-lg flex-shrink-0">{info.icon}</span>
                        <div className="flex-1">
                          <span className="font-semibold text-sm">{info.label}</span>
                          <span className="ml-2 text-xs opacity-60">{items.length}</span>
                        </div>
                        {categoryOpen ? (
                          <ChevronDown className="w-4 h-4 opacity-60" />
                        ) : (
                          <ChevronRight className="w-4 h-4 opacity-60" />
                        )}
                      </button>

                      {categoryOpen && (
                        <div className="border-t border-gray-100 divide-y divide-gray-100 bg-gray-50">
                          {items.map(manual => (
                            <button
                              key={manual.id}
                              onClick={() => onSelectManual(manual)}
                              className="w-full flex items-start gap-3 px-6 py-3 text-left hover:bg-gray-100 transition-colors group"
                            >
                              <BookOpen className="w-4 h-4 text-[#CC0000] flex-shrink-0 mt-0.5 opacity-50 group-hover:opacity-100" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 text-sm leading-snug">{manual.title}</p>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                  {manual.equipment_model && (
                                    <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-gray-600">
                                      {manual.equipment_model}
                                    </span>
                                  )}
                                  {manual.version && (
                                    <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-gray-600">
                                      v{manual.version}
                                    </span>
                                  )}
                                  {manual.manual_text && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ Searchable</span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#CC0000] flex-shrink-0 mt-0.5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}