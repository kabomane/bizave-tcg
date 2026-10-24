import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import console from 'node:console'

const ips = [...new Set(['127.0.0.1', ...Object.values(networkInterfaces()).flat().filter(item => item && item.family === 'IPv4' && !item.internal).map(item => item.address)])]
const openssl = ['C:/Program Files/Git/usr/bin/openssl.exe', 'C:/Program Files/OpenSSL-Win64/bin/openssl.exe'].find(existsSync) || 'openssl'
mkdirSync('.local/certificates', { recursive: true })
execFileSync(openssl, ['req', '-x509', '-newkey', 'rsa:2048', '-sha256', '-nodes', '-days', '365', '-keyout', '.local/certificates/lan-key.pem', '-out', '.local/certificates/lan-cert.pem', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,' + ips.map(ip => 'IP:' + ip).join(',')], { stdio: 'inherit', windowsHide: true })
console.log('Certificat local créé pour localhost et : ' + ips.join(', '))
