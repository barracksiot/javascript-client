# Barracks Node SDK

## CURL examples

**Check for updates:**
```
curl -v -XPOST -H "Authorization: ea355a683652ddad0461fc279f5a64687930bcb12502c044706a7d1d73972a0e" -H "Content-type: application/json" -d '{ "unitId": "unit'$c'", "versionId": "v0.0.1" }' https://130.211.14.34/api/device/update/check --insecure
```
- 204 no content
- 200 update available
```
{
	"versionId":"unique1",
	"packageInfo":{
		"url":"<http://barracks.ddns.net/update/download/1152723d-a267-4cd5-aaac-511e568d4681",
		"md5":"5f396472788fde9b770bffb7ae2c6deb",
		"size":1447
	},
	"properties":{
		"jsonkey":"value"
	}
}
```
- Download file
- Check hash
- Check size?
- Execute callback, pass on properties if necessary

**Download update:**
```
curl -H "Authorization: ea355a683652ddad0461fc279f5a64687930bcb12502c044706a7d1d73972a0e" https://130.211.14.34/api/device/update/download/b3f3ecc7-0f93-4d9d-92d6-668a6ff8b1ee --insecure > flux.zip
```

## Live environments

- https://130.211.14.34 ==> Prod
- https://barracks.ddns.net/ ==> dev
- http://integration.barracks.io/ui/ ==> integration

1a7b3df2f64488c444d20204cdeb46ddd15792d6ef7f5309f46d697a7d87df8b

# Questions so far

-