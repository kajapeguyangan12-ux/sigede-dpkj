module.exports = {
  apps: [
    {
      name: 'auto-approve-layanan',
      script: './scripts/autoApproveLayanan.mjs',
      cron_restart: '0 * * * *', // Run setiap jam pada menit ke-0
      autorestart: false,
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      error_file: './logs/auto-approve-error.log',
      out_file: './logs/auto-approve-output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      env: {
        NODE_ENV: 'production',
        TZ: 'Asia/Makassar' // Timezone WITA (Bali)
      }
    }
  ]
};
