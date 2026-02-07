package in.thegamut.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
// 1. Import the Splash Screen API
import androidx.core.splashscreen.SplashScreen;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 2. Initialize the Splash Screen (MUST be before super.onCreate)
        SplashScreen.installSplashScreen(this);
        
        super.onCreate(savedInstanceState);
    }
}
