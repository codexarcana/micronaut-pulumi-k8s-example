package io.eldermael.pulumi.k8s.app;

import io.micronaut.context.ApplicationContext;
import io.micronaut.context.annotation.Value;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
@Controller("/config")
public class ConfigController {

  @Inject
  private ApplicationContext context;

  @Value("${io.eldermael.pulumi.app.config.entry}")
  private String entryValue;

  @Value("${io.eldermael.pulumi.app.secret.entry}")
  private String secretValue;

  @Get(produces = MediaType.APPLICATION_JSON)

  public Object config() {
    return Map.of(
        "config", this.entryValue,
        "secret", this.secretValue
        );

  }

}
