# API

## Deploy

### Deploy serverless app to aws

```AWS_PROFILE=<> sls deploy```

### See Logs locally

```sls logs -f app```

### Invoke lambda locally for secret santa api

```sls invoke local --function app```

### Invoke lambda locally for secret santa send email

```sls invoke local --function send-email```

### Send email to test

```bash
  SECRET_SANTA_TABLE=secret-santa-api-dev AWS_PROFILE=min-aws npm run send:email
```

## Get my secret santa

Returns your secretSanta

```curl -H "Content-Type: application/json" -X GET ${BASE_URL}/api/secretsanta/reveal/inigo/avengers```

## Setup Secret Santa Group with members

Requires an array of objects, with a memberName and email.

```curl -H "Content-Type: application/json" -X POST ${BASE_URL}api/secretsanta/setup/avengers -d '[{"memberName":"inigo", "email":"test@email.com"},{"memberName":"ryan", "email":"test@2email.com"}]'```

Data

```json
[{"memberName":"name1","email":"emailAddress"},{"memberName":"name2","email":"emailAddress"}]
```

## Get GiftIdeas for a member
Get gift ideas for a member

```curl -H "Content-Type: application/json" -X GET ${BASE_URL}/api/secretsanta/giftIdeas/ryan/avengers'```

## Add GiftIdeas for a member
Add gift ideas, so your secret santa has some ideas of what you might prefer to get.

Data

```json
{"giftIdeas":["socks","candles","toys"]}
```

```curl -H "Content-Type: application/json" -X PUT ${BASE_URL}/api/secretsanta/giftIdeas/ryan/avengers -d '{"giftIdeas":["socks","candles","toys"]}'```

dev/api/secretsanta/giftIdeas/ryan/avengers

## Add Exclusion lists for a member
Provide the ability to set names you don't want to be drawn with.

Data

```json
{"exclusions":["name1","name2"]}
```

```curl -H "Content-Type: application/json" -X PUT ${BASE_URL}/api/secretsanta/exclusions/<name>/<groupID> -d '{"exclusions":["<name>"]}'```

## Generate Draw
Group has to have been setup already, will assign a secretSanta to each member in the group. This information is saved to the database.

```curl -H "Content-Type: application/json" -X GET ${BASE_URL}/api/secretsanta/draw/avengers```