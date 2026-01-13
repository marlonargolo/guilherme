import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Language = "pt" | "es" | "en";

const languages = {
  pt: { name: "Português", flag: "🇧🇷" },
  es: { name: "Español", flag: "🇪🇸" },
  en: { name: "English", flag: "🇺🇸" },
};

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="text-lg">{languages[language].flag}</span>
          <span className="hidden sm:inline">{languages[language].name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languages).map(([code, { name, flag }]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as Language)}
            className="gap-2 cursor-pointer"
          >
            <span className="text-lg">{flag}</span>
            <span>{name}</span>
            {language === code && (
              <span className="ml-auto text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
