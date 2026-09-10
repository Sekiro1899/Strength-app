# Photos de fond

Cinq photos d'ambiance, affichées derrière le contenu sur le tableau de bord,
le profil, l'historique, la préparation de séance et le résultat d'onboarding.
`lib/backdrops.ts` en choisit une par écran, de façon stable : un fond qui
changerait à chaque rendu donnerait le tournis.

| Fichier          | Sujet                          | Auteur (Pexels) |
|------------------|--------------------------------|-----------------|
| `01-wraps.jpg`   | Bandes de boxe                 | Anna            |
| `02-stack.jpg`   | Colonne de plaques             | Abhi            |
| `03-airbike.jpg` | Air bike sous les néons        | Fire Flint      |
| `04-spin.jpg`    | Roues de vélos de biking       | Dave Garcia     |
| `05-rings.jpg`   | Anneaux de gymnastique         | Ivan S          |

## Traitement

Le **noir et blanc est cuit dans les fichiers**, pas appliqué en CSS : `filter`
n'existe pas côté natif, et le faire au build donne le même rendu partout sans
coût au rendu. Le fondu vers le fond, lui, reste à l'affichage.

Les originaux faisaient 20 Mo à eux cinq (jusqu'à 4672 × 7008). À 32 %
d'opacité derrière un dégradé sombre, ça ne se serait pas vu — seulement senti
au poids du bundle. Recette appliquée, à reproduire pour toute nouvelle photo :

```python
from PIL import Image, ImageOps

im = Image.open(source)
im = ImageOps.exif_transpose(im)      # respecte l'orientation EXIF
im = ImageOps.grayscale(im)
if im.width > 1440:                   # couvre un téléphone en 3x
    im = im.resize((1440, round(im.height * 1440 / im.width)), Image.LANCZOS)
im.save(cible, "JPEG", quality=72, optimize=True, progressive=True)
```

Résultat : 20,1 Mo → 1,06 Mo.

## En ajouter une

Dépose le fichier ici après traitement, puis ajoute son `require` dans
`lib/backdrops.ts`. Une liste vide n'est pas une erreur : le fond retombe
alors sur une composition géométrique.
