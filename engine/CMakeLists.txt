add_executable(dpi_engine
    src/dpi_mt.cpp
    src/connection_tracker.cpp
    src/dpi_engine.cpp
    src/fast_path.cpp
    src/load_balancer.cpp
    src/packet_parser.cpp
    src/pcap_reader.cpp
    src/rule_manager.cpp
    src/sni_extractor.cpp
    src/types.cpp
)

target_include_directories(dpi_engine
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_compile_features(dpi_engine PRIVATE cxx_std_17)

if(MSVC)
    target_compile_options(dpi_engine PRIVATE /W4)
else()
    target_compile_options(dpi_engine PRIVATE -Wall -Wextra)
endif()