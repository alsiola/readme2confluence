# readme2confluence

CLI to publish package READMEs to Confluence Cloud

## Installation
Install globally with either:

`npm install -g readme2confluence`

or

`yarn global add readme2confluence`

## Usage
THe following CLI arguments can be used.  Only username, apikey, space and company are required.

```
  -V, --version             output the version number
  -u --username [username]  Username
  -k --apikey [apikey]      API Key
  -s --space [space]        Confluent Space
  -c --company [company]    Company name (url slug)
  -a --ancestor [ancestor]  Parent page ID
  -h, --help                output usage information
```

Alternatively, the following environment variables will be used if CLI arguments are not provided:

```
    RTC_USERNAME,
    RTC_APIKEY,
    RTC_SPACE,
    RTC_COMPANY,
    RTC_ANCESTOR
```

Typical usage is:

```
readme2confluence \
--username test@example.com \
--apikey secret \
--space GF \
--company companyname \
--ancestor 12345678
```