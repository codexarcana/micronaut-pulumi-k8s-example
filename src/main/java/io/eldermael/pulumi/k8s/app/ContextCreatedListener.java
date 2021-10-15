package io.eldermael.pulumi.k8s.app;


import io.micronaut.context.ApplicationContext;
import io.micronaut.context.event.StartupEvent;
import io.micronaut.runtime.event.annotation.EventListener;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Singleton
public class ContextCreatedListener {

  @Inject
  private ApplicationContext context;

  @EventListener
  public void onStartupEvent(StartupEvent e) {
    context.getEnvironment().getPropertySources().forEach((ps) -> {
      log.info("Found property source: '{}'", ps.getName());
    });
  }

}
