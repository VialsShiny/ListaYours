# Keep-alive de la VM Oracle (contournement)

Oracle peut récupérer une instance Always Free jugée inactive. Règle officielle (lue le 2026-11-08,
https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm) :

> "Idle Always Free compute instances may be reclaimed by Oracle. Oracle will deem virtual machine and
> bare metal compute instances as idle if, during a 7-day period, the following are true:
> CPU utilization for the 95th percentile is less than 20%; Network utilization is less than 20%;
> Memory utilization is less than 20% (applies to A1 shapes only)"

Les **trois** conditions doivent être vraies pour que l'instance soit jugée inactive. Ce dossier
installe un timer systemd qui, toutes les 5 minutes, vérifie `/health` puis occupe un cœur pendant
60 s en priorité minimale (`nice 19`). Sur une A1 à 2 OCPU, cela représente environ 50 % de CPU
instance pendant 1 minute sur 5, ce qui vise à maintenir le 95e percentile au-dessus de 20 %.

**Ce qui n'est pas vérifié [uncertain]** : la granularité d'échantillonnage et la méthode exacte de
calcul du 95e percentile par Oracle, le devenir d'une instance récupérée (arrêt ou suppression) et
l'exemption éventuelle des tenancies passées en Pay As You Go. Ce mécanisme est un contournement :
surveillez les métriques dans la console OCI (Compute > Instances > votre instance > Metrics) et
ajustez `KEEPALIVE_BURST_SECONDS`.

## Installation (sur la VM, depuis le clone du dépôt)

```bash
sudo install -m 0755 deploy/keepalive/keepalive.sh /usr/local/bin/listayours-keepalive.sh
sudo install -m 0644 deploy/keepalive/listayours-keepalive.service /etc/systemd/system/
sudo install -m 0644 deploy/keepalive/listayours-keepalive.timer /etc/systemd/system/
printf 'KEEPALIVE_URL=http://127.0.0.1:8000/health\nKEEPALIVE_PUBLIC_URL=https://API_DOMAIN/api/public/wishlists\nKEEPALIVE_BURST_SECONDS=60\n' \
  | sudo tee /etc/default/listayours-keepalive >/dev/null
sudo sed -i "s#API_DOMAIN#$(grep '^API_DOMAIN=' deploy/oracle/.env | cut -d= -f2- | tr -d '"'"'"'"')#" /etc/default/listayours-keepalive
sudo systemctl daemon-reload
sudo systemctl enable --now listayours-keepalive.timer
systemctl list-timers listayours-keepalive.timer
sudo journalctl -u listayours-keepalive.service -n 20 --no-pager
```

`KEEPALIVE_URL` vise `127.0.0.1:8000` : `docker-compose.prod.yml` publie le port 8000 de l'API sur
l'interface loopback uniquement. `KEEPALIVE_PUBLIC_URL` passe par Caddy et génère aussi un peu de
trafic réseau sortant/entrant.

## Désinstallation

```bash
sudo systemctl disable --now listayours-keepalive.timer
sudo rm /etc/systemd/system/listayours-keepalive.{service,timer} /usr/local/bin/listayours-keepalive.sh /etc/default/listayours-keepalive
sudo systemctl daemon-reload
```
