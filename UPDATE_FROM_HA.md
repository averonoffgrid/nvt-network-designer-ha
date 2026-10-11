# Aktualizacje NVT Network Designer z Home Assistant

Repozytorium jest przygotowane jako zewnętrzne repozytorium aplikacji Home Assistant z gotowymi obrazami GHCR.

## Pierwsza instalacja

1. Repozytorium GitHub musi być publiczne: `https://github.com/averonoffgrid/nvt-network-designer-ha`.
2. GitHub Actions po pushu do `main` buduje obrazy `amd64` i `aarch64` i publikuje manifest:
   `ghcr.io/averonoffgrid/nvt-network-designer:<version>`.
3. Jednorazowo ustaw pakiet GHCR `nvt-network-designer` jako Public.
4. W Home Assistant dodaj repozytorium:
   `https://github.com/averonoffgrid/nvt-network-designer-ha`
5. Zainstaluj aplikację z tego repozytorium, nie z Local Apps `/addons`.

## Następne aktualizacje

1. Zmień `version:` w `nvt_network_designer/config.yaml`, np. z `0.3.0` na `0.3.1`.
2. Wprowadź zmiany i push do głównej gałęzi (`main` lub `master`).
3. GitHub Actions zbuduje i opublikuje nowy obraz.
4. Home Assistant po odświeżeniu repozytoriów pokaże przycisk **Aktualizuj**.

Dane użytkownika pozostają w `/data` i nie są zastępowane przez aktualizację obrazu.

## Ważne

Nie utrzymuj równolegle aktywnej lokalnej kopii `/addons/nvt_network_designer` i wersji repozytoryjnej — wcześniejszy problem polegał właśnie na rozjechaniu źródeł w `/addons` z faktycznie uruchomionym obrazem.
