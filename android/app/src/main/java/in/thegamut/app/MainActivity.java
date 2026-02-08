package in.thegamut.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import androidx.core.splashscreen.SplashScreen;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Fix: Re-enable Splash Screen to prevent launch issues
        SplashScreen.installSplashScreen(this);
        
        super.onCreate(savedInstanceState);
    }
}
