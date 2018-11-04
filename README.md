# API

## Deploy

### Deploy serverless app to aws

```AWS_PROFILE=<> sls deploy```

### See Logs locally

```sls logs -f app```

### Invoke lambda locally

```sls invoke local --function app```

## Get my secret santa
Returns your secretSanta

GET - http://localhost:4001/api/secretsanta/reveal/<name>/<group>

## Setup Secret Santa Group with members
Requires an array of objects, with a memberName and email.

POST - http://localhost:4001/api/secretsanta/setup/<group>

Data
```
[{"memberName":"name1","email":"emailAddress"},{"memberName":"name2","email":"emailAddress"}]
```

## Add GiftIdeas for a member
Add gift ideas, so your secret santa has some ideas of what you might prefer to get.

PUT - http://localhost:4001/api/secretsanta/giftIdeas/<name>/<group>

Data
```
{"giftIdeas":["socks","candles","toys"]}
```

## Add Exclusion lists for a member
Provide the ability to set names you don't want to be drawn with.

PUT - http://localhost:4001/api/secretsanta/exclusions/<name>/<group>

Data
```
{"exclusions":["name1","name2"]}
```

## Generate Draw
Group has to have been setup already, will assign a secretSanta to each member in the group. This information is saved to the database.

PUT - http://localhost:4001/api/secretsanta/draw/<group>