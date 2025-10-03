Pod::Spec.new do |s|
  s.name         = "react-native-ar-gps"
  s.version      = "1.0.0"
  s.summary      = "GPS-based AR library for React Native with proper world coordinate anchoring"
  s.homepage     = "https://github.com/your-org/react-native-ar-gps"
  s.license      = "MIT"
  s.authors      = { "Your Name" => "your.email@example.com" }
  s.platforms    = { :ios => "12.0" }
  s.source       = { :git => "https://github.com/your-org/react-native-ar-gps.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.requires_arc = true

  # ARKit framework requirement
  s.frameworks = "ARKit", "CoreLocation", "SceneKit"
  
  # iOS 12.0+ for ARKit 3.0 features
  s.ios.deployment_target = "12.0"

  s.dependency "React-Core"
  
  # Swift support
  s.swift_version = "5.0"
end