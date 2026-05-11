import os
import re

directory = "/Users/davidcervantes/Documents/Plataforma de Gestión Procesal Civil/client/src/pages"
files = ["CaseDetail.tsx", "Dashboard.tsx", "NewCase.tsx", "Register.tsx", "Profile.tsx", "Login.tsx"]

replacements = [
    # STATUS_CLASS changes
    (r'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', 'bg-secondary text-secondary-foreground'),
    (r'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', 'bg-primary text-primary-foreground'),
    (r'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', 'bg-muted text-muted-foreground border'),
    
    # Specific color removals for components
    (r'color="text-teal-\d+"', 'color="text-foreground"'),
    (r'color="text-amber-\d+"', 'color="text-foreground"'),
    (r'color="text-slate-\d+"', 'color="text-muted-foreground"'),
    (r'color="text-purple-\d+"', 'color="text-foreground"'),
    
    # Role icon and badge colors
    (r'text-amber-400 bg-amber-400/10 ring-amber-400/30', 'text-foreground bg-muted ring-border'),
    (r'text-teal-400 bg-teal-400/10 ring-teal-400/30', 'text-foreground bg-muted ring-border'),
    (r'text-purple-400 bg-purple-400/10 ring-purple-400/30', 'text-foreground bg-muted ring-border'),
    
    (r'bg-amber-400/10 ring-amber-400/30 text-amber-400', 'bg-muted ring-border text-foreground'),
    (r'bg-teal-400/10 ring-teal-400/30 text-teal-400', 'bg-muted ring-border text-foreground'),
    (r'bg-purple-400/10 ring-purple-400/30 text-purple-400', 'bg-muted ring-border text-foreground'),
    
    # General text colors
    (r'text-amber-\d+', 'text-foreground'),
    (r'text-teal-\d+', 'text-foreground'),
    (r'text-purple-\d+', 'text-foreground'),
    (r'text-violet-\d+', 'text-foreground'),
    
    # General bg colors
    (r'bg-teal-\d+/10 border-teal-\d+/30', 'bg-muted border-border'),
    (r'border-teal-\d+/30 bg-teal-\d+/10', 'border-border bg-muted'),
    (r'bg-teal-\d+', 'bg-foreground'),
    
    # Focus classes
    (r'focus-within:border-violet-\d+/70', 'focus-within:border-foreground'),
    (r'focus-within:bg-violet-\d+/10', 'focus-within:bg-muted'),
    
    # Inline styles
    (r'style=\{\{\s*background:\s*"linear-gradient.*?"\s*\}\}', 'className="bg-zinc-950 text-white"'),
    (r'style=\{\{\s*background:\s*"radial-gradient.*?"\s*\}\}', ''),
    (r'style=\{\{\s*boxShadow:\s*"0 0 40px hsl.*?"\s*\}\}', ''),
    
    # Fix any gold-text leftover if any
    (r'gold-text', 'text-foreground font-semibold')
]

for filename in files:
    filepath = os.path.join(directory, filename)
    if not os.path.exists(filepath): continue
    with open(filepath, 'r') as f:
        content = f.read()
        
    for p, r in replacements:
        content = re.sub(p, r, content)
        
    with open(filepath, 'w') as f:
        f.write(content)

print("Done")
