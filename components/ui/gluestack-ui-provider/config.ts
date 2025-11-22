'use client';
import { vars } from 'nativewind';

export const config = {
  light: vars({
    /* Primary - Athletic Blue */
    '--color-primary-0': '255 255 255',
    '--color-primary-50': '232 241 255',   // #E8F1FF
    '--color-primary-100': '201 220 255',  // #C9DCFF
    '--color-primary-200': '157 190 255',  // #9DBEFF
    '--color-primary-300': '111 161 255',  // #6FA1FF
    '--color-primary-400': '75 140 255',   // #4B8CFF
    '--color-primary-500': '30 111 255',   // #1E6FFF
    '--color-primary-600': '21 87 204',    // #1557CC
    '--color-primary-700': '16 68 163',    // #1044A3
    '--color-primary-800': '11 50 122',    // #0B327A
    '--color-primary-900': '7 34 90',      // #07225A
    '--color-primary-950': '4 20 46',      // #04142E

    /* Secondary - Accent Lime */
    '--color-secondary-0': '255 255 255',
    '--color-secondary-50': '245 255 232',  // #F5FFE8
    '--color-secondary-100': '232 255 201', // #E8FFC9
    '--color-secondary-200': '212 255 157', // #D4FF9D
    '--color-secondary-300': '191 255 111', // #BFFF6F
    '--color-secondary-400': '177 255 87',  // #B1FF57
    '--color-secondary-500': '163 255 63',  // #A3FF3F
    '--color-secondary-600': '130 204 50',  // #82CC32
    '--color-secondary-700': '102 153 38',  // #669926
    '--color-secondary-800': '77 115 28',   // #4D731C
    '--color-secondary-900': '51 77 19',    // #334D13
    '--color-secondary-950': '26 38 9',     // #1A2609

    /* Tertiary - Keep oranges for variety */
    '--color-tertiary-0': '255 250 245',
    '--color-tertiary-50': '255 242 229',
    '--color-tertiary-100': '255 233 213',
    '--color-tertiary-200': '254 209 170',
    '--color-tertiary-300': '253 180 116',
    '--color-tertiary-400': '251 157 75',
    '--color-tertiary-500': '231 129 40',
    '--color-tertiary-600': '215 117 31',
    '--color-tertiary-700': '180 98 26',
    '--color-tertiary-800': '130 73 23',
    '--color-tertiary-900': '108 61 19',
    '--color-tertiary-950': '84 49 18',

    /* Error */
    '--color-error-0': '254 233 233',
    '--color-error-50': '254 226 226',
    '--color-error-100': '254 202 202',
    '--color-error-200': '252 165 165',
    '--color-error-300': '248 113 113',
    '--color-error-400': '239 68 68',
    '--color-error-500': '230 53 53',
    '--color-error-600': '220 38 38',
    '--color-error-700': '185 28 28',
    '--color-error-800': '153 27 27',
    '--color-error-900': '127 29 29',
    '--color-error-950': '83 19 19',

    /* Success */
    '--color-success-0': '228 255 244',
    '--color-success-50': '202 255 232',
    '--color-success-100': '162 241 192',
    '--color-success-200': '132 211 162',
    '--color-success-300': '102 181 132',
    '--color-success-400': '72 151 102',
    '--color-success-500': '16 185 129',  // #10B981
    '--color-success-600': '5 150 105',   // #059669
    '--color-success-700': '32 111 62',
    '--color-success-800': '22 101 52',
    '--color-success-900': '20 83 45',
    '--color-success-950': '27 50 36',

    /* Warning */
    '--color-warning-0': '255 249 245',
    '--color-warning-50': '255 244 236',
    '--color-warning-100': '255 231 213',
    '--color-warning-200': '254 205 170',
    '--color-warning-300': '253 173 116',
    '--color-warning-400': '251 149 75',
    '--color-warning-500': '245 158 11',  // #F59E0B
    '--color-warning-600': '217 119 6',   // #D97706
    '--color-warning-700': '180 90 26',
    '--color-warning-800': '130 68 23',
    '--color-warning-900': '108 56 19',
    '--color-warning-950': '84 45 18',

    /* Info */
    '--color-info-0': '236 248 254',
    '--color-info-50': '199 235 252',
    '--color-info-100': '162 221 250',
    '--color-info-200': '124 207 248',
    '--color-info-300': '87 194 246',
    '--color-info-400': '50 180 244',
    '--color-info-500': '59 130 246',   // #3B82F6
    '--color-info-600': '37 99 235',    // #2563EB
    '--color-info-700': '9 115 168',
    '--color-info-800': '7 90 131',
    '--color-info-900': '5 64 93',
    '--color-info-950': '3 38 56',

    /* Typography - Neutral Grays */
    '--color-typography-0': '255 255 255',
    '--color-typography-50': '247 247 250',  // #F7F7FA
    '--color-typography-100': '236 236 241', // #ECECF1
    '--color-typography-200': '218 218 224', // #DADAE0
    '--color-typography-300': '194 194 204', // #C2C2CC
    '--color-typography-400': '160 160 173', // #A0A0AD
    '--color-typography-500': '126 126 142', // #7E7E8E
    '--color-typography-600': '98 98 112',   // #626270
    '--color-typography-700': '74 74 87',    // #4A4A57
    '--color-typography-800': '51 51 62',    // #33333E
    '--color-typography-900': '31 31 38',    // #1F1F26
    '--color-typography-950': '15 15 19',    // #0F0F13

    /* Outline - Neutral Grays */
    '--color-outline-0': '255 255 255',
    '--color-outline-50': '247 247 250',
    '--color-outline-100': '236 236 241',
    '--color-outline-200': '218 218 224',
    '--color-outline-300': '194 194 204',
    '--color-outline-400': '160 160 173',
    '--color-outline-500': '126 126 142',
    '--color-outline-600': '98 98 112',
    '--color-outline-700': '74 74 87',
    '--color-outline-800': '51 51 62',
    '--color-outline-900': '31 31 38',
    '--color-outline-950': '15 15 19',

    /* Background - Neutral Grays */
    '--color-background-0': '255 255 255',
    '--color-background-50': '247 247 250',
    '--color-background-100': '236 236 241',
    '--color-background-200': '218 218 224',
    '--color-background-300': '194 194 204',
    '--color-background-400': '160 160 173',
    '--color-background-500': '126 126 142',
    '--color-background-600': '98 98 112',
    '--color-background-700': '74 74 87',
    '--color-background-800': '51 51 62',
    '--color-background-900': '31 31 38',
    '--color-background-950': '15 15 19',

    /* Background Special */
    '--color-background-error': '254 241 241',
    '--color-background-warning': '255 243 234',
    '--color-background-success': '237 252 242',
    '--color-background-muted': '247 248 247',
    '--color-background-info': '235 248 254',

    /* Focus Ring Indicator */
    '--color-indicator-primary': '30 111 255',  // primary-500
    '--color-indicator-info': '59 130 246',     // info-500
    '--color-indicator-error': '185 28 28',
  }),
  dark: vars({
    /* Primary - Athletic Blue (lighter for dark mode) */
    '--color-primary-0': '4 20 46',
    '--color-primary-50': '7 34 90',
    '--color-primary-100': '11 50 122',
    '--color-primary-200': '16 68 163',
    '--color-primary-300': '21 87 204',
    '--color-primary-400': '30 111 255',
    '--color-primary-500': '75 140 255',   // Brighter for dark mode
    '--color-primary-600': '111 161 255',
    '--color-primary-700': '157 190 255',
    '--color-primary-800': '201 220 255',
    '--color-primary-900': '232 241 255',
    '--color-primary-950': '255 255 255',

    /* Secondary - Accent Lime */
    '--color-secondary-0': '26 38 9',
    '--color-secondary-50': '51 77 19',
    '--color-secondary-100': '77 115 28',
    '--color-secondary-200': '102 153 38',
    '--color-secondary-300': '130 204 50',
    '--color-secondary-400': '163 255 63',
    '--color-secondary-500': '163 255 63',  // Same brightness
    '--color-secondary-600': '191 255 111',
    '--color-secondary-700': '212 255 157',
    '--color-secondary-800': '232 255 201',
    '--color-secondary-900': '245 255 232',
    '--color-secondary-950': '255 255 255',

    /* Tertiary */
    '--color-tertiary-0': '84 49 18',
    '--color-tertiary-50': '108 61 19',
    '--color-tertiary-100': '130 73 23',
    '--color-tertiary-200': '180 98 26',
    '--color-tertiary-300': '215 117 31',
    '--color-tertiary-400': '231 129 40',
    '--color-tertiary-500': '251 157 75',
    '--color-tertiary-600': '253 180 116',
    '--color-tertiary-700': '254 209 170',
    '--color-tertiary-800': '255 233 213',
    '--color-tertiary-900': '255 242 229',
    '--color-tertiary-950': '255 250 245',

    /* Error */
    '--color-error-0': '83 19 19',
    '--color-error-50': '127 29 29',
    '--color-error-100': '153 27 27',
    '--color-error-200': '185 28 28',
    '--color-error-300': '220 38 38',
    '--color-error-400': '230 53 53',
    '--color-error-500': '239 68 68',
    '--color-error-600': '249 97 96',
    '--color-error-700': '229 91 90',
    '--color-error-800': '254 202 202',
    '--color-error-900': '254 226 226',
    '--color-error-950': '254 233 233',

    /* Success */
    '--color-success-0': '27 50 36',
    '--color-success-50': '20 83 45',
    '--color-success-100': '22 101 52',
    '--color-success-200': '32 111 62',
    '--color-success-300': '5 150 105',
    '--color-success-400': '16 185 129',
    '--color-success-500': '72 151 102',
    '--color-success-600': '102 181 132',
    '--color-success-700': '132 211 162',
    '--color-success-800': '162 241 192',
    '--color-success-900': '202 255 232',
    '--color-success-950': '228 255 244',

    /* Warning */
    '--color-warning-0': '84 45 18',
    '--color-warning-50': '108 56 19',
    '--color-warning-100': '130 68 23',
    '--color-warning-200': '180 90 26',
    '--color-warning-300': '217 119 6',
    '--color-warning-400': '245 158 11',
    '--color-warning-500': '251 149 75',
    '--color-warning-600': '253 173 116',
    '--color-warning-700': '254 205 170',
    '--color-warning-800': '255 231 213',
    '--color-warning-900': '255 244 237',
    '--color-warning-950': '255 249 245',

    /* Info */
    '--color-info-0': '3 38 56',
    '--color-info-50': '5 64 93',
    '--color-info-100': '7 90 131',
    '--color-info-200': '9 115 168',
    '--color-info-300': '37 99 235',
    '--color-info-400': '59 130 246',
    '--color-info-500': '50 180 244',
    '--color-info-600': '87 194 246',
    '--color-info-700': '124 207 248',
    '--color-info-800': '162 221 250',
    '--color-info-900': '199 235 252',
    '--color-info-950': '236 248 254',

    /* Typography - Inverted Neutral Grays */
    '--color-typography-0': '15 15 19',
    '--color-typography-50': '31 31 38',
    '--color-typography-100': '51 51 62',
    '--color-typography-200': '74 74 87',
    '--color-typography-300': '98 98 112',
    '--color-typography-400': '126 126 142',
    '--color-typography-500': '160 160 173',
    '--color-typography-600': '194 194 204',
    '--color-typography-700': '218 218 224',
    '--color-typography-800': '236 236 241',
    '--color-typography-900': '247 247 250',
    '--color-typography-950': '255 255 255',

    /* Outline */
    '--color-outline-0': '15 15 19',
    '--color-outline-50': '31 31 38',
    '--color-outline-100': '51 51 62',
    '--color-outline-200': '74 74 87',
    '--color-outline-300': '98 98 112',
    '--color-outline-400': '126 126 142',
    '--color-outline-500': '160 160 173',
    '--color-outline-600': '194 194 204',
    '--color-outline-700': '218 218 224',
    '--color-outline-800': '236 236 241',
    '--color-outline-900': '247 247 250',
    '--color-outline-950': '255 255 255',

    /* Background */
    '--color-background-0': '15 15 19',      // #0F0F13
    '--color-background-50': '31 31 38',     // #1F1F26
    '--color-background-100': '51 51 62',    // #33333E
    '--color-background-200': '74 74 87',    // #4A4A57
    '--color-background-300': '98 98 112',   // #626270
    '--color-background-400': '126 126 142',
    '--color-background-500': '160 160 173',
    '--color-background-600': '194 194 204',
    '--color-background-700': '218 218 224',
    '--color-background-800': '236 236 241',
    '--color-background-900': '247 247 250',
    '--color-background-950': '255 255 255',

    /* Background Special */
    '--color-background-error': '66 43 43',
    '--color-background-warning': '65 47 35',
    '--color-background-success': '28 43 33',
    '--color-background-muted': '51 51 51',
    '--color-background-info': '26 40 46',

    /* Focus Ring Indicator */
    '--color-indicator-primary': '75 140 255',
    '--color-indicator-info': '87 194 246',
    '--color-indicator-error': '232 70 69',
  }),
};