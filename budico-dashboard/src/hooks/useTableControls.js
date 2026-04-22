/**
 * Custom Hooks
 */

import React, { useState } from "react";

/**
 * Hook for managing table sorting, filtering, and searching
 */
export const useTableControls = (data, searchFields = []) => {
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [search, setSearch] = useState("");

  const filtered = data.filter(row => {
    const searchOk =
      !search ||
      searchFields.some(f =>
        String(row[f] || "")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    const filterOk = Object.entries(filters).every(
      ([k, v]) => !v || v === "ALL" || String(row[k] || "") === String(v)
    );
    return searchOk && filterOk;
  });

  const sorted = sortField
    ? [...filtered].sort((a, b) => {
        const av = a[sortField] ?? "";
        const bv = b[sortField] ?? "";
        const cmp =
          typeof av === "number"
            ? av - bv
            : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filtered;

  return {
    rows: sorted,
    filters,
    setFilters,
    sortField,
    setSortField,
    sortDir,
    setSortDir,
    search,
    setSearch
  };
};

/**
 * Hook for managing modal state and form data
 */
export const useModalState = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  const openModal = (initialData = {}) => {
    setFormData(initialData);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({});
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return {
    showModal,
    setShowModal,
    formData,
    setFormData,
    openModal,
    closeModal,
    updateFormData
  };
};

/**
 * Hook for live clock
 */
export const useLiveClock = () => {
  const [time, setTime] = useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    timeString: time.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }),
    dateString: time.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  };
};

/**
 * Hook for managing multi-select filter dropdowns
 */
export const useFilterDropdown = () => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (fieldName) => {
    setOpenDropdown(openDropdown === fieldName ? null : fieldName);
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };

  return {
    openDropdown,
    setOpenDropdown,
    toggleDropdown,
    closeDropdown
  };
};
