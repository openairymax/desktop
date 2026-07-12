mod backend_client;
mod cli;
mod commands;
mod llm_client;
mod protocol_commands;

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::get_system_info,
            commands::execute_cli_command,
            commands::get_service_status,
            commands::start_services,
            commands::stop_services,
            commands::restart_services,
            commands::get_logs,
            commands::get_health_status,
            commands::read_config_file,
            commands::write_config_file,
            commands::list_agents,
            commands::get_agent_details,
            commands::submit_task,
            commands::get_task_status,
            commands::cancel_task,
            commands::open_terminal,
            commands::open_browser,
            commands::check_for_updates,
            commands::get_version_info,
            // LLM / AI Chat
            commands::llm_chat,
            commands::test_llm_connection,
            commands::list_llm_providers,
            commands::save_llm_provider,
            commands::delete_llm_provider,
            // Memory System
            commands::memory_store,
            commands::memory_search,
            commands::memory_list,
            commands::memory_delete,
            commands::memory_clear,
            commands::context_window_stats,
            // Cognitive Loop / Tools
            commands::run_cognitive_loop,
            commands::call_tool,
            commands::list_tools,
            commands::runtime_metrics,
            // Extended Tasks
            commands::list_tasks,
            commands::delete_task,
            commands::restart_task,
            // Extended Agents
            commands::register_agent,
            // Settings
            commands::save_settings,
            commands::load_settings,
            // Agent Lifecycle
            commands::start_agent,
            commands::stop_agent,
            commands::get_agent_config,
            commands::update_agent_config,
            // File System Operations
            commands::list_directory,
            commands::read_file,
            commands::write_file,
            commands::delete_file,
            commands::copy_file,
            commands::move_file,
            commands::create_directory,
            // Process Management
            commands::list_processes,
            commands::kill_process,
            commands::get_process_info,
            // Network Diagnostics
            commands::get_network_interfaces,
            commands::check_port,
            commands::ping,
            commands::dns_lookup,
            // System Monitor
            commands::system_monitor,
            // Protocol Compatibility
            protocol_commands::list_protocols,
            protocol_commands::test_protocol_connection,
            protocol_commands::send_protocol_message,
            protocol_commands::get_protocol_capabilities,
        ])
        .setup(|app| {
            log::info!("Airymax AgentRT Desktop Client starting...");

            let show = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "隐藏到托盘", true, None::<&str>)?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let quit = PredefinedMenuItem::quit(app, Some("退出"))?;

            let tray_menu = Menu::with_items(app, &[&show, &hide, &sep1, &quit])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Airymax AgentRT")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(true) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            log::info!("Airymax AgentRT ready - System tray active");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Airymax AgentRT");
}
